"use strict";(self.webpackChunkdocusaurus_blog=self.webpackChunkdocusaurus_blog||[]).push([[908],{3701:e=>{e.exports=JSON.parse('{"blogPosts":[{"id":"/combine","metadata":{"permalink":"/docusaurus-blog/blog/combine","editUrl":"https://github.com/Maksimka101/docusaurus-blog/tree/master/blog/combine/index.md","source":"@site/blog/combine/index.md","title":"Combine","description":"Combine logo","date":"2022-09-04T00:00:00.000Z","formattedDate":"September 4, 2022","tags":[{"label":"dart","permalink":"/docusaurus-blog/blog/tags/dart"},{"label":"flutter","permalink":"/docusaurus-blog/blog/tags/flutter"},{"label":"isolates","permalink":"/docusaurus-blog/blog/tags/isolates"},{"label":"package","permalink":"/docusaurus-blog/blog/tags/package"}],"readingTime":5.99,"hasTruncateMarker":true,"authors":[],"frontMatter":{"title":"Combine","date":"2022-09-4","tags":["dart","flutter","isolates","package"]},"nextItem":{"title":"Welcome","permalink":"/docusaurus-blog/blog/welcome"}},"content":"![Combine logo](combine_logo.png)\\n\\nOne of the keys to a successful application is performance. At the most time, it\'s fine to do everything \\nin the main Isolate. However, sometimes you need to do some heavy task that may take significant time - 8 \\nor even 16 ms. In that case, you should create a new Isolate to perform a calculation in it. Dart\'s Isolates API \\nis complicated. So it would be great to use a package that simplifies it. In pub dev, we have a lot of great \\npackages for that and in this article I\'ll show one new and special - \\n[Combine](https://pub.dev/packages/combine)\\n\\n\x3c!-- truncate --\x3e\\n<details>\\n  <summary>\\n    Haven\'t heard about isolate?\\n  </summary>\\n  <div>\\n    <p>\\n      All Dart code runs inside of isolates. Each isolate has its own memory heap, ensuring that none of the state\\n      in an isolate is accessible from any other isolate.\\n    </p>\\n    You can read about them in the <a href=\\"https://dart.dev/guides/language/concurrency#how-isolates-work\\"> \\n    Dart documentation</a>.\\n  </div>\\n</details>\\n\\nThe **combine** package is created to make it easier to use Isolate in these scenarios:\\n- Create Isolate and communicate with it\\n- Efficiently execute tasks in the Isolates pool\\n- Use Method Channels in the Isolate\\n- Laziness. Nothing will be created until it\'s used\\n- The stub on the web platform\\n\\nLet\'s go through some items and compare Combine with Isolate!\\n\\n\\n### Combine Isolate\\n\\nEverything you need is to call a `spawn` method and pass `entryPoint` function.\\n\\n```dart\\nfinal isolateInfo = await Combine().spawn((context) {\\n  print(\\"Argument from main isolate: ${context.argument}\\");\\n\\n  context.messenger.messages.listen((message) {\\n    print(\\"Message from main isolate: $message\\");\\n  });\\n}, argument: 42);\\n\\nisolateInfo.messenger\\n  ..messages.listen((message) {\\n    print(\\"Message from isolate: $message\\");\\n  })\\n  ..send(\\"Hello from main isolate!\\");\\n```\\n\\n<details>\\n  <summary>\\n    The same using pure Isolate\\n  </summary>\\n  <div>\\n    <p>\\n      This code is two times longer and more complicated.\\n    </p>\\n    <pre language=\\"dart\\">\\n{\'final port = ReceivePort();\\\\n\'}\\n{\'await Isolate.spawn(\\\\n\'}\\n{\'  (args) {\\\\n\'}\\n{\'    print(\\"Argument from main isolate: ${args[1]}\\");\\\\n\'}\\n{\'\\\\n\'}\\n{\'    final SendPort sendPort = values[0];\\\\n\'}\\n{\'    final port = ReceivePort();\\\\n\'}\\n{\'    sendPort.send(port.sendPort);\\\\n\'}\\n{\'\\\\n\'}\\n{\'    port.listen((message) {\\\\n\'}\\n{\'      print(\\"Message from main isolate: $message\\");\\\\n\'}\\n{\'    });\\\\n\'}\\n{\'  },\\\\n\'}\\n{\'  [port.sendPort, 42],\\\\n\'}\\n{\');\\\\n\'}\\n{\'\\\\n\'}\\n{\'late final SendPort sendPort\\\\n\'}\\n{\'port.listen((data) {\\\\n\'}\\n{\'  if (data is SendPort) {\\\\n\'}\\n{\'    sendPort = data;\\\\n\'}\\n{\'    sendPort.send(\\"Hello from main isolate!\\");\\\\n\'}\\n{\'  } else {\\\\n\'}\\n{\'    print(\\"Message from isolate: $data\\");\\\\n\'}\\n{\'  }\\\\n\'}\\n{\'});\\\\n\'}\\n    </pre>\\n  </div>\\n</details>\\n\\nThe spawn method returns `IsolateInfo` which holds:\\n- `IsolateMessenger` to communicate with isolate. It has:\\n  - `messages` getter which returns a stream of messages from the isolate\\n  - `send` method which sends a message to the isolate\\n- `CombineIsolate` is a representation of isolate. It\'s used to kill isolate.\\n\\n`entryPoint` function will be executed in the isolate.\\nIt may be a static method or a top-level function as well as a class method or lambda function.\\nIt even may use closure variables with some limitations. \\nSee [the closure variables section](#closure-variables) for more info.\\n\\nThe entry point receives `context` as an argument. Context is a holder for:\\n- `argument` parameter which was passed to the `spawn` method\\n- `IsolateMessenger` \\n- `CombineIsolate`. \\n\\n\\n<details>\\n  <summary>\\n    The <code>spawn</code> method parameters.\\n  </summary>\\n  <div>\\n    This method takes a few parameters:\\n    <ul>\\n      <li>\\n        <code>entryPoint</code> which was described above.\\n      </li>\\n      <li>\\n        The <code>argument</code> parameter which will be accessible with <code>context.argument</code> from \\n        the entry point function\\n      </li>\\n      <li>\\n        <code>errorsAreFatal</code> which specifies whether isolate should be killed on the uncaught exception.\\n      </li>\\n      <li>\\n        <code>debugName</code> is a name of the isolate which is visible in the editor.\\n      </li>\\n    </ul>\\n  </div>\\n</details>\\n\\n\\n### Isolates pool\\n\\nThe most interesting part of this package is an Isolates pool which is named `CombineWorker`. \\nWith it, you can schedule the tasks which will be executed in the isolates pool. \\n\\nIt\'s designed to be as safe and easy to use as possible. \\n- by default, you don\'t need to initialize the worker. It will be initialized while the first usage.\\n- you can initialize the worker manually and without waiting for initialization to complete, start to schedule \\n  the tasks. \\n- while initialization, you can specify the number of tasks per isolate using the tasksPerIsolate parameter. \\n  If you want to execute asynchronous tasks which work with a file, network, or just an event loop, it will be \\n  more efficient to run 2 or more tasks in the same isolate.\\n- you can close the worker and cancel all the tasks or let them finish before closing.\\n- exception in the task will be sent to the main isolate and thrown in it. \\n  For example `final futureResult = CombineWorker().execute(() => throw IsolateException())`. \\n  In that case, `futureResult` will be completed with `IsolateException`.\\n\\nSmall usage example from the documentation:\\n\\n```dart\\nawait CombineWorker().initialize();\\n\\nfinal helloWorld = await CombineWorker().execute(zeroArgsFunction);\\nfinal maksim = await CombineWorker().executeWithArg(oneArgFunction, \\"Maksim\\");\\nfinal helloArshak  = await CombineWorker().executeWith2Args(\\n  twoArgsFunction, \\n  \\"Hello\\", \\"Arshak!\\"\\n);\\n\\nString zeroArgsFunction() => \\"Hello, World!\\";\\nString oneArgFunction(String str) => str;\\nString twoArgsFunction(String a, String b) => \\"$a, $b\\";\\n```\\n\\n:::tip\\nMultiple `CombineWorker` instances.\\n\\nAlthough it is a singleton you still can create a few instances of workers \\nwith different configurations.\\nCombine worker uses `CombineWorkerImpl` under the hood which is not a singleton and \\nnothing prevents you from using it.\\n:::\\n\\n\\n### Method Channels\\n\\nBy default, you can\'t use Method Channels outside of the main Isolate. However, it\'s possible to use them in the \\nCombine Isolate!\\n\\nIt works because Combine overrides the default binary messenger and redirects messages to the main Isolate.\\nSometimes it\'s not good for performance because this binary message will be copied twice. To send it \\nto the main Isolate and the platform. So I recommend you to be careful when working with Method Channels.\\n\\n\\n### Closure variables\\n\\nIsolate `entryPoint` function for `spawn` method or `task` function for the `execute` methods \\nmay be a first-level, as well as a static or top-level.\\n\\nAlso, it may use closure variables but with some restrictions:\\n - closure variable will be copied (as every variable passed to isolate)\\n   so it won\'t be synchronized across Isolates.\\n - if you use at least one variable from closure all closure variables\\n   will be copied to the Isolate due to this [issue](https://github.com/dart-lang/sdk/issues/36983).\\n   It can lead to high memory consumption or event exception because\\n   some variables may contain native resources.\\n\\nDue to the above points, I highly recommend you avoid using closure variables\\nuntil this issue is fixed.\\n\\n\\n## Comparison\\n\\nEach of these plugins is great however it\'s impossible to be perfect. So I\'ll try to show the weakness \\nand strengths of Combine.\\n\\n\\n### [Executor](https://pub.dev/packages/worker_manager)\\n\\nExecutor pros:\\n- It\'s mature\\n- The task can be canceled\\n- Task and isolate pool can be paused\\n- Doesn\'t depends on the flutter\\n  \\nCombine pros:\\n- Provides API for creating and working with isolate\\n- Allows to work with method channels\\n- Customizable. You can specify the number of parallel tasks per isolate and worker closing strategy.\\n\\n\\n### [Flutter isolate](https://pub.dev/packages/flutter_isolate)\\n\\nFlutter isolate pros:\\n- It\'s mature too\\n- It works with method channels in the much more efficient way\\n  \\nCombine pros:\\n- Easier to use\\n- It\'s possible to send non-primitive objects\\n- Doesn\'t starts a new Flutter engine\\n- Works on all Flutter platforms\\n\\nI suggest you use Flutter isolate only when your main goal is to work with method channels.\\n\\n--- \\n\\nThank you for reading this article. I hope it will help you write cool and performant applications\ud83d\udd25"},{"id":"/welcome","metadata":{"permalink":"/docusaurus-blog/blog/welcome","editUrl":"https://github.com/Maksimka101/docusaurus-blog/tree/master/blog/welcome/index.md","source":"@site/blog/welcome/index.md","title":"Welcome","description":"Hello there","date":"2022-08-25T00:00:00.000Z","formattedDate":"August 25, 2022","tags":[],"readingTime":0.15,"hasTruncateMarker":false,"authors":[],"frontMatter":{"title":"Welcome","date":"2022-08-25T00:00:00.000Z"},"prevItem":{"title":"Combine","permalink":"/docusaurus-blog/blog/combine"}},"content":"Hello there\\n\\nI have created this blog to share my knowledge and thoughts about Dart, Flutter, app architecture and other tech\\nrelated topics. If you are interested, come on board!"}]}')}}]);