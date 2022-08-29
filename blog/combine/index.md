---
title: Combine
tags: [package, dart, flutter, isolates]
---

![Combine logo](combine_logo.png)

One of the keys to the success application is a performance. At the most time it's fine to do everything 
in the main Isolate. However sometimes you need to do some calculation which may take significant time - 
8 or event 16 ms. In that cases you should create a new Isolate to do calculation in it. Dart's Isolates
API is complicated. So it would be great to use a package which simplifies it's API. 
In pub dev we have a lot of great packages but in this article I'll cover one new and special - 
[Combine](https://pub.dev/packages/combine)

<!-- truncate -->
<details>
  <summary>
    Haven't heard about Isolate?
  </summary>
  <div>
    You can read about them in the <a href="https://dart.dev/guides/language/concurrency#how-isolates-work">
    Dart documentation</a>.
  </div>
</details>

**Combine** package is created to make it easier to use Isolate in these scenarios:
- Create Isolate and communicate with it
- Efficiently execute tasks in the Isolates pool
- Use Method Channels in the Isolate
- Laziness. Nothing will not be created until it's used

Let's go through each item!

### Create Combine Isolate

### Create Isolates pool

### Use Method Channels

By default you can't use Method Channels outside of the main Isolate. However it's possible to use them in the 
Combine Isolate!

It works because Combine overrides default binary messenger and redirects messages to the main Isolate.
It's not good for performance sometimes because this binary message will be copied twice. To send it 
to the main Isolate and to the platform. So I recommend you to be careful when working with Method Channels.

## Comparison

Each of these plugins is great however it's impossible to be perferc. So I'll try to show weakness and strengths 
of Combine 

### [Executor](https://pub.dev/packages/worker_manager)

### [Flutter isolate](https://pub.dev/packages/flutter_isolate)

