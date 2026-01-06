---
title: "ClickHouse is Slow"
date: 2018-11-09
description: "Practical ClickHouse optimization experience: from performance bottlenecks to solutions using arrays and data structures. Scaling statistics system."
tags: ["clickhouse", "optimization", "performance", "databases", "analytics", "scaling"]
---

In this talk, I share our experience working with ClickHouse at TrafficStars. We faced performance issues when scaling our statistics system, which processes up to 70,000 requests per second and stores about 50 terabytes of data.

The talk covers the evolution of our architecture: from the initial schema with Vertica and Citus to migrating to ClickHouse, issues with materialized views, index optimization, and the final solution using arrays and data structures.

{{< youtube id="efRryvtKlq0" title="ClickHouse is Slow" >}}

## TL;DR

When scaling our statistics system at TrafficStars, we encountered ClickHouse performance issues. Key takeaways:

- **Materialized views can make problems worse** — 30 materialized views turned one write problem into 30
- **Arrays and data structures are a powerful solution** — allowed us to reduce the number of tables from 30 to 5 without losing functionality
- **Index granularity is critical** — reducing granularity helped solve memory issues
- **Query optimizer delivers results** — up to 30% of queries are optimized automatically, average time dropped from 200–250 ms to 55 ms
- **Maintainability matters more than performance** — a simple system is important not only for developers but for business too

## Context: Statistics System Requirements

At TrafficStars, we work with an advertising network that processes up to 70,000 requests per second for our brands. We have two data centers in Europe and the US, multiple delivery servers, events are written to Kafka, and data storage is handled by ClickHouse. At the time of this talk (2018), we had approximately 500 statistics requests at peak, about 50 terabytes of data, and this doesn't include analytics work and analytical dashboards for managers.

### Characteristics of our data

- **Large clients** can account for up to 40% of traffic, creating uneven load distribution
- **Sudden traffic spikes** when new publishers are onboarded (easily increases by 5–10 thousand requests per second)
- **Real-time requirement**: statistics latency must be minimal, data is needed in real-time or close to it

Why is this critical? First, accurate user balance calculation—if we charge more than we should, it's bad for both the client and us. Second, clients frequently adjust their advertising campaigns, so they need current data to make decisions.

## Architecture Evolution: From Vertica to ClickHouse

### Initial Schema: Kafka → Vertica → Citus

When I joined the company in 2016, the architecture looked like this:

1. **Kafka** — all events were written to Kafka
2. **Workers** — processed data from Kafka
3. **Vertica** — stored raw data for several days, calculated statistics
4. **Citus** — long-term storage for aggregated data, also offloaded raw data to S3 for large reports

In Citus, we had one wide table with 29 columns (this sounds funny now, but it was normal back then). Everything worked reasonably well until growth problems started.

### Growth Problems

Performance began to degrade:

- **Simple queries** took 1.5 seconds or more
- **Complex queries** — from 30 seconds to infinity (didn't complete at all)

Example queries:
- **Simple**: count clicks, revenue by client within a date range
- **Complex**: grouping by multiple attributes, filtering by many attributes

### First Optimization Attempt: Aggregation

We tried aggressive aggregation—created many small tables for reports:

- Reports by operating systems
- Reports by browsers
- Reports by languages
- And so on

Plus one large wide table remained for custom reports. This helped: basic reports started completing in 30–150 milliseconds, freeing up resources for complex queries (now 10 seconds instead of infinity). But horizontal scaling of Citus costs money, and a lot of it. We needed a new solution.

## Migration to ClickHouse

### Why ClickHouse?

Requirements were simple:

- Horizontal scalability
- Fault tolerance
- Low cost of ownership
- Operational simplicity

ClickHouse promised everything would be fast, and we adopted it relatively quickly. The cost of ownership is indeed low—even I could deploy it. We managed to load data, even wrote a driver for the native protocol (because we don't have money for many servers, this was simpler).

We removed Vertica, removed Citus, and started storing everything in ClickHouse.

### First Data Model: Copying Schema from Citus

We created a prototype—took the schema that was in Citus and moved it to ClickHouse. Several queries worked great! But when we started checking other queries, everything was bad.

The problem was data access. In ClickHouse, there's one index—the primary key (clustered index). It takes data and sorts it according to the `ORDER BY` specified in the schema. Data is sorted by the primary key, and data access happens through it.

For example, if our index was on `publisher_id`, but we need to query by `campaign_id`, we have to scan a large amount of data—which works slowly.

### Solution: Separate Tables for Different Entities

We have two large categories of entities:

- **Advertisers** — advertising campaigns
- **Publishers** — only one (Yandex)

We decided to create separate tables for advertiser reports and publisher reports. This worked: we have the right index for advertisers, the right index for publishers—it was fast and good.

But how did we store data? We didn't have separate storage for raw events and separate storage for aggregated data—everything was in one system.

## Materialized Views: A Scaling Mistake

We thought: why not use materialized views? Periodically calculate events that we can't calculate in real-time.

Materialized views in ClickHouse work very well, but there's a nuance: they create a trigger on write. When we insert data into the raw events table, ClickHouse looks at what dependent tables (materialized views) exist, and in a loop applies the data block to each of them.

**Important to understand**: the query is applied to the data block we're inserting, not to the entire table. That is, `MAX` will be the maximum of this block, not of all table data.

### Problem: Sequential Writes

As a result, we're writing not to one table, but plus 30 more (by the number of materialized views). The problem was sequential writes—ClickHouse applies queries to the data block sequentially for each table.

During writes, time is also spent sorting data—all tables under materialized views have different sort keys, so we need to sort data for each table separately.

**Result**: we made the problem worse ourselves. We had one problem, we multiplied it by 30.

### Problem with Partitions and Merges

ClickHouse uses the MergeTree engine. Data is stored in partitions, partitions consist of parts. In each part, columns are stored as files, where data is written one after another.

**Problem**: when we write to ClickHouse, it always creates a new part. The more parts, the more disk operations, the more problems. ClickHouse constantly does merges in the background—gluing parts together, making them smaller and smaller.

At some point, we stopped keeping up with merges between parts. The problem was exacerbated by the fact that we wrote to different replicas, but despite this, merges happened sequentially, and we couldn't keep up.

## Final Solution: Arrays and Data Structures

We decided to reduce the number of tables, but didn't want to lose functionality and speed. The solution—use **arrays** to store reports.

### How It Works

Instead of many separate tables, we store data in arrays:

- One array—column identifiers (e.g., browsers)
- Another array—values for them (clicks, impressions, etc.)

We can do `arrayJoin`, and in the end we get: there's a row, and we store a set of rows as arrays. When we join arrays, we get a table from one row.

In one table, we can store a large number of reports at once—all those small reports we had (by operating systems, browsers, languages, etc.).

### Data Structures (Map)

Then we came to structures—`Map`. This is a very convenient thing. For example, we have a structure `browser_id` → `browser_count`, `clicks`, and anything else can be added—`price`, these are columns for it.

Important: all column lengths in the structure must be the same. It turns out, for each indicator we have some value with the same index.

### ReplacingMergeTree Engine

We use the `ReplacingMergeTree` engine with `-MergeTree` aggregation. This allows us in some cases not to store redundant aggregates. For example, for a sum we can store just a number, not an aggregate—this will work faster.

**Merge magic**: when we write data, it goes into a data block that is written to disk. There a merge happens, and here optimization occurs—magic happens. For rows that are sorted sequentially in blocks, we can sum them, we can remove duplicates. But this only happens during merge, not immediately on write.

### Optimization: Reducing the Number of Tables

In the end, we got:

- **5 report tables** instead of 30
- Two categories: publishers and advertisers
- Plus one table where we store data almost as-is (practically without aggregation), but we don't write to it in real-time

## Problems and Solutions

### Problem with Index Granularity

The number 8192—this is the default index granularity in ClickHouse. ClickHouse indexes not every row, but every 8192 rows (by default)—stores min/max values for the granule.

When we read data from disk, we need to unpack it into memory, read all remaining blocks additionally (in the worst case twice as much as the index size), and then apply a filter.

**Problem**: we had a client with large arrays (tens of millions of values instead of several thousand). When we read data for a client with a small amount of data, ClickHouse read all neighboring blocks, unpacked into memory, and there wasn't enough memory—queries failed.

**Solution**: we reduced index granularity. This didn't significantly affect memory usage, but queries started working much faster, and they started fitting in memory.

### Query Optimizer

Not all queries worked fast. We looked and understood: the problem is in indexes. One index—not always optimal. Data is sorted by one key, but queries go by another.

**Solution**: we wrote a query optimizer. It keeps relationships between objects in memory and periodically loads reference data. If we have some object in the condition, but we understand that there's an index for it too, we add this field to the filtering conditions.

Up to 30% of queries are optimized automatically. Average query time dropped from 200–250 milliseconds to 55 milliseconds.

## Results and Recommendations

### What We Achieved

1. **Simpler, more maintainable system**—this is the biggest advantage. For any system written by people, maintainability is important not only for programmers, but for business too.

2. **More data on the same hardware**—we can store and process more data, which is a significant advantage for us.

3. **Performance**: 
   - 2 parallel merges instead of constantly 16
   - 5 report tables instead of 30
   - Average query time: 55 milliseconds

### What's Missing

1. **Transactions**—we have several tables, and this threatens data consistency. Tables can differ because something was written to them at different times.

2. **Changing sort key**—this was promised to be released. A third key will appear: primary key (must index the rows), sort key (can be changed), and this will allow changing the key without repartitioning tables and save memory.

3. **Indexes for data structures**—also in development, need to check.

### Recommendations

1. **Read the documentation**—this is the first and most important thing.

2. **Understand the system**—ClickHouse is a fairly unique system, it's not quite familiar if you're migrating from another database. It has its own approach, it works differently.

3. **Don't be afraid of problems**—if you encounter difficulties, it definitely won't be easy at first. The task is serious, and you'll definitely have problems.

4. **Use the community**—ClickHouse has a very good community on Telegram, you can ask questions there, and you'll get help.

5. **Don't use it everywhere**—it's better if you already have experience or understanding of how it works and how it should work.

## Conclusion

ClickHouse is a powerful system that can work very fast, but requires understanding of its internals. Our experience showed that even with understanding of the system, you can encounter problems, but the right approach to data modeling and optimization allows us to achieve excellent results.

The most important thing is system maintainability. A simple system that's easy to maintain is important not only for developers, but for business too. And if business is doing poorly, you won't be doing very well either.
