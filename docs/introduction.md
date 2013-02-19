## Kissy 集成打包工具 Kissy Pie

### Kissy Pie 是什么

Kissy Pie 是一套基于约定的前端打包解决方案。设计目标是，通过统一的约定，提升应用的可维护性，将大家从重复的打包脚本的编写中解放出来。

KissyPie 的打包，包括了：

- JS（Kissy的模块编译， HTML模板到Kissy模块编译， 代码压缩）
- CSS （基于CSS-Combo的合并, 压缩）
- Less
- Sass

### 一切基于约定

KissyPie 的打包是基于一套目录结构规范，这个规范是经过实践与讨论总结的。这套目录结构，考虑到调试，部署，协作，代码的模块化与解耦，通用模块。适合于大多数应用场景。

### 易于使用

KissyPie 支持 Windows， Linux 与 Mac 等平台。 提供了一套命令行工具。比如
`ki init` 可以初始化一个应用。 `ki build page1/1.0 -t 20130219` 可以打包page1 的 1.0 版本 到时间戳目录 20130219。

同时，KissyPie还有一套Web界面可供使用，提供友好的打包体验。在命令行， 可以通过`ki web` 打开这个界面。下面是界面截图。

应用视图

![应用视图](http://i.imgur.com/yyCi2Pe.png)

Page视图

![Page视图](http://i.imgur.com/oQEGKtf.png)
