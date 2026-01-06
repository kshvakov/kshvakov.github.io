---
title: "Оптимизация запросов и доступа к данным (ClickHouse Meetup Exness, 07.05.2019)"
date: 2019-05-07
description: "Текстовая версия материалов доклада: агрегации, Nested-срезы, словари и приёмы ускорения запросов к логам."
tags: ["clickhouse", "sql", "оптимизация", "агрегации", "meetup"]
---




## Традиционно

Что влияет на скорость выполнения запросов?

- CPU
- Память
- Сеть
- «RAID с батарейкой»
- «Хороший RAID с батарейкой»
- Попутный ветер

Это всё не важно:

- чем больше — тем лучше
- чем лучше — тем лучше

## Менее традиционно

Если хочется улучшить — нужно переписывать код :)

Важно, но сложно.

## Есть теория

> Если какие-то вычисления занимают X секунд, то для того, чтобы нам потребовалось X/2 секунд, нужно вычислять X/2.  
> *— теория и практика эффективного менеджмента Т.П. Барсук. МСК 2003.*

> Существует мнение, что для того, чтобы эффективно считать статистику, данные нужно агрегировать, так как это позволяет уменьшить объём данных.  
> *— выдержка из документации к ClickHouse*

> И это правда :)

## Агрегировать?

### «Сырые» события

В Facebook на этот митап «собирались пойти» или «интересовались» 250 человек. Представим, что каждый раз, когда человек нажимал на кнопку, Facebook отправлял нам данные:

- тип («пойду» или «интересно»)
- время с точностью до секунды
- имя
- пол
- день рождения
- место рождения
- место работы
- должность

Мы записали данные как есть — это и будут «сырые» данные.

```sql
CREATE TABLE exness_events
(
    event_time DateTime,
    event_type Enum16('going' = 1, 'interested' = 2),
    name String,
    gender Enum16('male' = 1, 'female' = 2),
    date_of_birth Date,
    birthplace String,
    company String,
    position String
)
Engine MergeTree
PARTITION BY toYYYYMM(event_time)
ORDER BY (event_type, event_time);
```

Зачем вообще заранее агрегировать? Нам нужно понимать, сколько человек собирается посетить мероприятие — для этого нужно общее количество. И для этого нам совершенно не нужно каждый раз проверять все записи — достаточно создать таблицу, в которую мы запишем только тип события и их количество.

```sql
CREATE TABLE exness_events_agg
(
    event_type Enum16('going' = 1, 'interested' = 2),
    total Int16
)
Engine SummingMergeTree
PARTITION BY event_type
ORDER BY (event_type);

-- создадим триггер, который будет вызываться при каждой записи в exness_events
-- и писать в exness_events_agg
CREATE MATERIALIZED VIEW exness_events_mv TO exness_events_agg AS
SELECT event_type, toInt16(1) AS total
FROM exness_events;
```

Давайте проверим:

```sql
INSERT INTO exness_events
(
    event_time,
    event_type,
    name,
    gender,
    date_of_birth,
    birthplace,
    company,
    position
)
VALUES
('2019-05-01 12:15:41', 'going',      'Kirill',   'male',   '1983-12-13', 'Russia',  'Integros Video Platform', 'Golang developer'),
('2019-05-01 12:15:41', 'going',      'Mister V', 'male',   '1983-01-01', 'Russia',  'Aloha Browser',           'Backend developer'),
('2019-05-02 08:12:11', 'going',      'Miss X',   'female', '1995-10-25', 'Russia',  'Company A',               'T'),
('2019-05-02 08:12:11', 'going',      'Miss Y',   'female', '1985-01-24', 'Ukraine', 'Company A',               'T'),
('2019-05-02 11:15:11', 'interested', 'Mister Y', 'male',   '1983-01-01', 'Ukraine', 'Company B',               'T');

OPTIMIZE TABLE exness_events_agg FINAL;
SELECT * FROM exness_events_agg;
```

ClickHouse в фоне производит агрегацию в `SummingMergeTree` (вся «магия» MergeTree происходит во время слияний), поэтому мы не можем быть уверены, что в момент времени T все данные уже просуммировались, и правильный запрос будет выглядеть так:

```sql
SELECT
    event_type,
    SUM(total) AS total
FROM exness_events_agg
GROUP BY event_type;
```

Однако если нам вдруг потребуется ещё один статистический срез, то нам потребуется либо создавать ещё одну таблицу, либо добавлять колонку к уже существующей таблице `exness_events_agg`. Если нам потребуется много отчётов, то:

- если пользоваться советом «создавать таблицы», то в какой-то момент их может стать слишком много;
- если пользоваться советом «добавлять колонки», то при наличии достаточно большого количества колонок и различных вариантов агрегации это может стать бессмысленным.

Например, если мы захотим агрегировать данные по `event_time`, `event_type`, `name`, `gender` и `date_of_birth`, то мы получим количество данных, которое будет очень близко к сырым.

## Что делать?

Действительно, представим себе, что нам нужны отчёты с разбивкой по полу, типу события и дате:

- какие имена
- возраст на момент регистрации
- в какой компании работает
- должности

Для этого пересоздадим таблицу `exness_events_agg` и материализованное представление `exness_events_mv`:

```sql
TRUNCATE TABLE exness_events;
DROP TABLE exness_events_agg;
DROP TABLE exness_events_mv;

CREATE TABLE exness_events_agg
(
    event_date Date,
    event_type Enum16('going' = 1, 'interested' = 2),
    gender Enum16('male' = 1, 'female' = 2),
    total Int64,
    nameMap Nested( id UInt64, total Int64 ),
    ageMap Nested( age Int8, total Int64 ),
    companyMap Nested( id UInt64, total Int64 ),
    positionMap Nested( id UInt64, total Int64 )
)
Engine SummingMergeTree
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_type, gender, event_date);

CREATE MATERIALIZED VIEW exness_events_mv TO exness_events_agg AS
SELECT
    toDate(event_time) AS event_date,
    event_type,
    gender,
    toInt64(1) AS total,
    [cityHash64(name)] AS `nameMap.id`,
    [total]            AS `nameMap.total`,
    [toInt8((today() - date_of_birth) / 365)] AS `ageMap.age`,
    [total]                                   AS `ageMap.total`,
    [cityHash64(company)] AS `companyMap.id`,
    [total]               AS `companyMap.total`,
    [cityHash64(position)] AS `positionMap.id`,
    [total]                AS `positionMap.total`
FROM exness_events;
```

К сожалению, на тот момент ни `SummingMergeTree`, ни функция `sumMap` не могли оперировать строками в качестве аргументов, поэтому чтобы суммировать одинаковые значения, мы считаем хэш от строки и сохраняем его.

Так как мы храним хэшированное значение, то нам нужно будет его преобразовывать обратно. Для этого создадим словарь и сохраним в нём пару ключ-значение:

```sql
CREATE TABLE exness_dictionary
(
    id UInt64,
    value String
)
Engine ReplacingMergeTree
PARTITION BY tuple()
ORDER BY id;

CREATE MATERIALIZED VIEW exness_dictionary_mv TO exness_dictionary AS
SELECT DISTINCT
    cityHash64(value) AS id,
    value
FROM exness_events
ARRAY JOIN [name, company, position] AS value;
```

Пример файла конфигурации словаря для ClickHouse:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<dictionaries>
  <dictionary>
    <name>exness</name>
    <source>
      <clickhouse>
        <host>127.0.0.1</host>
        <port>9000</port>
        <user>default</user>
        <password />
        <db>default</db>
        <table>exness_dictionary</table>
      </clickhouse>
    </source>
    <lifetime>600</lifetime>
    <layout>
      <hashed />
    </layout>
    <structure>
      <id>
        <name>id</name>
      </id>
      <attribute>
        <name>value</name>
        <type>String</type>
        <null_value />
      </attribute>
    </structure>
  </dictionary>
</dictionaries>
```

Снова запишем наши данные, затем посмотрим агрегаты и построим несколько отчётов:

```sql
INSERT INTO exness_events
(
    event_time,
    event_type,
    name,
    gender,
    date_of_birth,
    birthplace,
    company,
    position
)
VALUES
('2019-05-01 12:15:41', 'going',      'Kirill',   'male',   '1983-12-13', 'Russia',  'Integros Video Platform', 'Golang developer'),
('2019-05-01 12:15:41', 'going',      'Mister V', 'male',   '1983-01-01', 'Russia',  'Aloha Browser',           'Backend developer'),
('2019-05-02 08:12:11', 'going',      'Miss X',   'female', '1995-10-25', 'Russia',  'Company A',               'T'),
('2019-05-02 08:12:11', 'going',      'Miss Y',   'female', '1985-01-24', 'Ukraine', 'Company A',               'T'),
('2019-05-02 11:15:11', 'interested', 'Mister Y', 'male',   '1983-01-01', 'Ukraine', 'Company B',               'T');

OPTIMIZE TABLE exness_events_agg FINAL;

-- базовый отчёт
SELECT event_type, SUM(total) AS total
FROM exness_events_agg
GROUP BY event_type;

-- нам интересно сколько девушек собирается пойти
SELECT SUM(total) AS going
FROM exness_events_agg
WHERE event_type = 'going' AND gender = 'female';

-- возраст :)
SELECT ageMap.age AS age, SUM(ageMap.total) AS going
FROM exness_events_agg
ARRAY JOIN ageMap
WHERE event_type = 'going' AND gender = 'female'
GROUP BY age;

-- может быть в каких компаниях работают?
SELECT
    dictGetString('exness', 'value', companyMap.id) AS company,
    SUM(companyMap.total) AS going
FROM exness_events_agg
ARRAY JOIN companyMap
WHERE event_type = 'going' AND gender = 'female'
GROUP BY company;
```

Как мы видим, данных более чем достаточно для построения различных отчётов, при этом строк в агрегированной таблице будет значительно меньше, чем в таблице с исходными данными. Однако если посмотреть на структуру, станет очевидно, что мы, несмотря на то, что все данные у нас остались сохранены, из‑за агрегации потеряли часть связей и не можем построить запрос, например, который выдаст нам, кто в какой компании и на какой должности работает.

> В качестве вывода: иногда агрегация может сильно выручать, значительно уменьшая объём данных, однако не стоит забывать, что в этом случае мы жертвуем как минимум потерей части связей между данными.

## Часть вторая, когда просто написать SQL может быть недостаточно

Теперь более жизненный пример: видеоплатформа, где нужно:
- отчёты по просмотрам/трафику;
- детализация по пользователю и по видео;
- и главное — **лог доступа**, где почти всегда нужен запрос «последние N событий».

Давайте немного усложним задачу. Представим, что у нас есть некий сервис, например, это некоторая видеоплатформа. На платформе работают пользователи, их юзкейс очень простой: пользователи загружают какое-то видео, это видео показывается, и нужно видеть статистику по показам и по трафику, а также лог доступа к видео.

Создадим таблицу с сырыми событиями:

```sql
CREATE TABLE video_events
(
    event_time DateTime,
    user_id Int32,
    video_id Int64,
    bytes Int64,
    os LowCardinality(String),
    device LowCardinality(String),
    browser LowCardinality(String),
    country LowCardinality(String),
    domain LowCardinality(String)
)
Engine MergeTree
PARTITION BY toYYYYMM(event_time)
ORDER BY (event_time, user_id, video_id);
```

И перед тем как действовать дальше пришло время уточнить требования.

На самом деле статистику должен видеть владелец как по всем видео, так и с детализацией по конкретному видео, причём нам важны просмотры по датам. Также в системе есть администраторы, которые хотят видеть статистику глобально по всем пользователям, а также с детализацией до конкретного пользователя и видео. Помимо статистики необходимо видеть действия (лог доступа), которые являются ничем иным, как сырыми событиями, при этом должна быть фильтрация по всем колонкам.

Мы уже знаем о том, что агрегирование данных может быть хорошим решением. Исходя из опыта и имеющихся данных, мы знаем, что у нас достаточно много событий, которые неплохо «свернутся» при агрегации.

Создадим таблицу:

```sql
CREATE TABLE video_events_agg
(
    date Date,
    user_id Int32,
    video_id Int64,
    os LowCardinality(String),
    device LowCardinality(String),
    browser LowCardinality(String),
    country LowCardinality(String),
    domain LowCardinality(String),
    bytes_total Int64,
    count Int64,
    min_time AggregateFunction(min, DateTime),
    max_time AggregateFunction(max, DateTime),
    timeMap Nested
    (
        hour UInt8,
        count Int64
    )
)
Engine SummingMergeTree
PARTITION BY toYYYYMM(date)
PRIMARY KEY (date, user_id, video_id)
ORDER BY (date, user_id, video_id, os, device, browser, country, domain);

-- Как мы видим, наша таблица для агрегированных данных содержит те же колонки, что и таблица сырых данных,
-- поэтому мы сможем строить произвольные запросы к ней
CREATE MATERIALIZED VIEW video_events_mv TO video_events_agg AS
SELECT
    toDate(event_time) AS date,
    user_id,
    video_id,
    os,
    device,
    browser,
    country,
    domain,
    toInt64(1) AS count,
    bytes AS bytes_total,
    arrayReduce('minState', [event_time]) AS min_time,
    arrayReduce('maxState', [event_time]) AS max_time,
    [toHour(event_time)] AS `timeMap.hour`,
    [count]              AS `timeMap.count`
FROM video_events;
```

Запишем немного данных:

```sql
INSERT INTO video_events
(
    event_time,
    user_id,
    video_id,
    bytes,
    os,
    device,
    browser,
    country,
    domain
)
WITH
    (['Linux', 'OS X', 'Windows'] AS oses,
     ['Desktop', 'Mobile', 'Tablet'] AS devices,
     ['Chrome', 'Firefox', 'IE'] AS browsers,
     ['CY', 'RU', 'UA', 'BY', 'US', 'UK', 'NL'] AS countries,
     ['clickhouse.yandex', 'altinity.com', 'exness.com'] AS domains)
SELECT
    now() - number AS event_time,
    U AS user_id,
    U * 1000 + (rand() % 1000) AS video_id,
    rand() AS bytes,
    oses[(rand() + user_id * 1) % length(oses) + 1] AS os,
    devices[(rand() + user_id * 2) % length(devices) + 1] AS device,
    browsers[(rand() + user_id * 3) % length(browsers) + 1] AS browser,
    countries[(rand() + user_id * 4) % length(countries) + 1] AS country,
    domains[(rand() + user_id * 5) % length(domains) + 1] AS domain
FROM numbers(3600*24*30)
ARRAY JOIN range(50) AS U, range(5) AS V
WHERE U > 0;

-- добавим больше неуникальных событий
INSERT INTO video_events SELECT * FROM video_events;
INSERT INTO video_events SELECT * FROM video_events;

OPTIMIZE TABLE video_events_agg FINAL;
```

Видим, что агрегация дала нам некоторый профит.

Запросы выполняются за приемлемое время:

```sql
SELECT count()
FROM video_events_agg
WHERE user_id = 7;

SELECT count()
FROM video_events_agg
WHERE video_id = 7000;
```

Но для запросов по конкретному видео у нас читается значительно больше строк, чем при запросе по конкретному пользователю.

Учитывая, что мы уверены в том, что конкретное видео всегда соответствует конкретному пользователю (данные связаны), мы можем оптимизировать запрос, добавив в него `user_id`:

```sql
SET send_logs_level = 'trace';

SELECT count()
FROM video_events_agg
WHERE (video_id = 7000) AND (user_id = 7);
```

Однако лучше, чтобы подобными вещами занималась СУБД :)

## Экспериментальные возможности

Теперь ClickHouse поддерживает создание дополнительных индексов. В классическом понимании индексы помогают что-то найти, в ClickHouse же индексы позволяют пропускать блоки и не читать их.

```sql
SET allow_experimental_data_skipping_indices = 1;
-- возможность пока экспериментальная, надо включать

ALTER TABLE video_events_agg
    ADD INDEX idx_video_id video_id TYPE minmax GRANULARITY 3;

OPTIMIZE TABLE video_events_agg FINAL;

-- Проверим
SELECT count()
FROM video_events_agg
WHERE video_id = 7000;
```

### Где боль: «последние 10 действий»

Требование: логи в обратном хронологическом порядке.

```sql
SELECT *
FROM video_events
WHERE (video_id = 7000) AND (user_id = 7)
ORDER BY event_time DESC
LIMIT 10;
```

На данных из материалов доклада это приводило к чтению сотен миллионов строк и секундам ожидания.

### Учитывая то, что мы уже накопили статистических данных в таблице с агрегатами…

…грех этим не воспользоваться.

```sql
SELECT
    toDateTime(date) + INTERVAL hour HOUR AS from,
    max_time AS to,
    runningAccumulate(state) AS count
FROM
(
    SELECT date, hour, max_time, state
    FROM
    (
        SELECT
            date,
            timeMap.hour            AS hour,
            sumState(timeMap.count) AS state
        FROM video_events_agg
        ARRAY JOIN timeMap
        WHERE video_id = 7000 AND user_id = 7
        GROUP BY date, hour
        ORDER BY date DESC, hour DESC
    )
    ANY JOIN
    (
        SELECT
            date,
            maxMerge(max_time) AS max_time
        FROM video_events_agg
        WHERE video_id = 7000 AND user_id = 7
        GROUP BY date
    )
    USING (date)
)
WHERE count > 10
LIMIT 1;
```

Мы получили интервал времени, в котором есть необходимые нам события. Пробуем оптимизировать запрос.

```sql
SELECT *
FROM video_events
WHERE (video_id = 7000) AND (user_id = 7)
  AND event_time >= '2019-05-05 18:00:00'
  AND event_time <= '2019-05-05 19:07:23'
ORDER BY event_time DESC
LIMIT 10;
```

Итого: 0.051 sec для определения «стоимости» запроса и 0.039 sec на выполнение. 0.09 vs 3.327 sec

## В качестве вывода

Оптимизация, основанная на статистике о распределении данных, является достаточно мощным инструментом, позволяющим уменьшить время отклика системы и снизить нагрузку.



Источники:
- Материалы доклада (SQL-листинг): [kshvakov/ClickHouse-Meetup-Exness](https://github.com/kshvakov/ClickHouse-Meetup-Exness)
- Отчёт ClickHouse о митапе: [ClickHouse Meetup in Limassol on May 7, 2019](https://clickhouse.com/blog/click-house-meetup-in-limassol-on-may-7-2019)