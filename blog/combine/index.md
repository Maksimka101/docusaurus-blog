---
title: Combine
date: 2022-09-4
tags: [dart, flutter, isolates, package]
---

![Combine logo](combine_logo.png)

One of the keys to a successful application is performance. At the most time, it's fine to do everything 
in the main Isolate. However, sometimes you need to do some heavy task that may take significant time - 8 
or even 16 ms. In that case, you should create a new Isolate to perform a calculation in it. Dart's Isolates API 
is complicated. So it would be great to use a package that simplifies it. In pub dev, we have a lot of great 
packages for that and in this article I'll show one new and special - 
[Combine](https://pub.dev/packages/combine)

<!-- truncate -->
<details>
  <summary>
    Haven't heard about isolate?
  </summary>
  <div>
    <p>
      All Dart code runs inside of isolates. Each isolate has its own memory heap, ensuring that none of the state
      in an isolate is accessible from any other isolate.
    </p>
    You can read about them in the <a href="https://dart.dev/guides/language/concurrency#how-isolates-work"> 
    Dart documentation</a>.
  </div>
</details>

The **combine** package is created to make it easier to use Isolate in these scenarios:
- Create Isolate and communicate with it
- Efficiently execute tasks in the Isolates pool
- Use Method Channels in the Isolate
- Laziness. Nothing will be created until it's used
- The stub on the web platform

Let's go through some items and compare Combine with Isolate!


### Combine Isolate

Everything you need is to call a `spawn` method and pass `entryPoint` function.

```dart
final isolateInfo = await Combine().spawn((context) {
  print("Argument from main isolate: ${context.argument}");

  context.messenger.messages.listen((message) {
    print("Message from main isolate: $message");
  });
}, argument: 42);

isolateInfo.messenger
  ..messages.listen((message) {
    print("Message from isolate: $message");
  })
  ..send("Hello from main isolate!");
```

<details>
  <summary>
    The same using pure Isolate
  </summary>
  <div>
    <p>
      This code is two times longer and more complicated.
    </p>
    <pre language="dart">
{'final port = ReceivePort();\n'}
{'await Isolate.spawn(\n'}
{'  (args) {\n'}
{'    print("Argument from main isolate: ${args[1]}");\n'}
{'\n'}
{'    final SendPort sendPort = values[0];\n'}
{'    final port = ReceivePort();\n'}
{'    sendPort.send(port.sendPort);\n'}
{'\n'}
{'    port.listen((message) {\n'}
{'      print("Message from main isolate: $message");\n'}
{'    });\n'}
{'  },\n'}
{'  [port.sendPort, 42],\n'}
{');\n'}
{'\n'}
{'late final SendPort sendPort\n'}
{'port.listen((data) {\n'}
{'  if (data is SendPort) {\n'}
{'    sendPort = data;\n'}
{'    sendPort.send("Hello from main isolate!");\n'}
{'  } else {\n'}
{'    print("Message from isolate: $data");\n'}
{'  }\n'}
{'});\n'}
    </pre>
  </div>
</details>

The spawn method returns `IsolateInfo` which holds:
- `IsolateMessenger` to communicate with isolate. It has:
  - `messages` getter which returns a stream of messages from the isolate
  - `send` method which sends a message to the isolate
- `CombineIsolate` is a representation of isolate. It's used to kill isolate.

`entryPoint` function will be executed in the isolate.
It may be a static method or a top-level function as well as a class method or lambda function.
It even may use closure variables with some limitations. 
See [the closure variables section](#closure-variables) for more info.

The entry point receives `context` as an argument. Context is a holder for:
- `argument` parameter which was passed to the `spawn` method
- `IsolateMessenger` 
- `CombineIsolate`. 


<details>
  <summary>
    The <code>spawn</code> method parameters.
  </summary>
  <div>
    This method takes a few parameters:
    <ul>
      <li>
        <code>entryPoint</code> which was described above.
      </li>
      <li>
        The <code>argument</code> parameter which will be accessible with <code>context.argument</code> from 
        the entry point function
      </li>
      <li>
        <code>errorsAreFatal</code> which specifies whether isolate should be killed on the uncaught exception.
      </li>
      <li>
        <code>debugName</code> is a name of the isolate which is visible in the editor.
      </li>
    </ul>
  </div>
</details>


### Isolates pool

The most interesting part of this package is an Isolates pool which is named `CombineWorker`. 
With it, you can schedule the tasks which will be executed in the isolates pool. 

It's designed to be as safe and easy to use as possible. 
- by default, you don't need to initialize the worker. It will be initialized while the first usage.
- you can initialize the worker manually and without waiting for initialization to complete, start to schedule 
  the tasks. 
- while initialization, you can specify the number of tasks per isolate using the tasksPerIsolate parameter. 
  If you want to execute asynchronous tasks which work with a file, network, or just an event loop, it will be 
  more efficient to run 2 or more tasks in the same isolate.
- you can close the worker and cancel all the tasks or let them finish before closing.
- exception in the task will be sent to the main isolate and thrown in it. 
  For example `final futureResult = CombineWorker().execute(() => throw IsolateException())`. 
  In that case, `futureResult` will be completed with `IsolateException`.

Small usage example from the documentation:

```dart
await CombineWorker().initialize();

final helloWorld = await CombineWorker().execute(zeroArgsFunction);
final maksim = await CombineWorker().executeWithArg(oneArgFunction, "Maksim");
final helloArshak  = await CombineWorker().executeWith2Args(
  twoArgsFunction, 
  "Hello", "Arshak!"
);

String zeroArgsFunction() => "Hello, World!";
String oneArgFunction(String str) => str;
String twoArgsFunction(String a, String b) => "$a, $b";
```

:::tip
Multiple `CombineWorker` instances.

Although it is a singleton you still can create a few instances of workers 
with different configurations.
Combine worker uses `CombineWorkerImpl` under the hood which is not a singleton and 
nothing prevents you from using it.
:::


### Method Channels

By default, you can't use Method Channels outside of the main Isolate. However, it's possible to use them in the 
Combine Isolate!

It works because Combine overrides the default binary messenger and redirects messages to the main Isolate.
Sometimes it's not good for performance because this binary message will be copied twice. To send it 
to the main Isolate and the platform. So I recommend you to be careful when working with Method Channels.


### Closure variables

Isolate `entryPoint` function for `spawn` method or `task` function for the `execute` methods 
may be a first-level, as well as a static or top-level.

Also, it may use closure variables but with some restrictions:
 - closure variable will be copied (as every variable passed to isolate)
   so it won't be synchronized across Isolates.
 - if you use at least one variable from closure all closure variables
   will be copied to the Isolate due to this [issue](https://github.com/dart-lang/sdk/issues/36983).
   It can lead to high memory consumption or event exception because
   some variables may contain native resources.

Due to the above points, I highly recommend you avoid using closure variables
until this issue is fixed.


## Comparison

Each of these plugins is great however it's impossible to be perfect. So I'll try to show the weakness 
and strengths of Combine.


### [Executor](https://pub.dev/packages/worker_manager)

Executor pros:
- It's mature
- The task can be canceled
- Task and isolate pool can be paused
- Doesn't depends on the flutter
  
Combine pros:
- Provides API for creating and working with isolate
- Allows to work with method channels
- Customizable. You can specify the number of parallel tasks per isolate and worker closing strategy.


### [Flutter isolate](https://pub.dev/packages/flutter_isolate)

Flutter isolate pros:
- It's mature too
- It works with method channels in the much more efficient way
  
Combine pros:
- Easier to use
- It's possible to send non-primitive objects
- Doesn't starts a new Flutter engine
- Works on all Flutter platforms

I suggest you use Flutter isolate only when your main goal is to work with method channels.

--- 

Thank you for reading this article. I hope it will help you write cool and performant applications🔥

