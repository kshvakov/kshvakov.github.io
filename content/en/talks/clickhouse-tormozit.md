---
title: "ClickHouse is Slow"
youtube_id: efRryvtKlq0
date: 2018-11-09
duration: PT45M
publisher: TrafficStars
transcript: /assets/transcripts/efRryvtKlq0.ru.txt
description: |
  In this talk, I share our experience working with ClickHouse at TrafficStars. 
  We faced performance issues when scaling our statistics system, which processes 
  up to 70,000 requests per second and stores about 50 terabytes of data.
  
  The talk covers the evolution of our architecture: from the initial schema with Vertica 
  and Citus to migrating to ClickHouse, issues with materialized views, index optimization, 
  and the final solution using arrays and data structures.
short_description: Breaking down ClickHouse performance bottlenecks and the optimization strategies that actually work.
---
