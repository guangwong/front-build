## v0.4.2 ~ v0.4.5

    - bugfixes
        * 在转码时，忽略 .svn 目录
        * css-combo 升级到0.2.4

    - 添加打包信息的展示，出错详细信息展示， 升级的Web界面
    - 添加全局配置， 配置文件放在用户目录
    - 添加tools 目录下的命令快捷方式， 如打开Web界面，或升级修复应用
    - 在应用目录下执行fb web 或 tools/web-client.bat(sh) 可直接在浏览器中打开应用

## v0.4.1

    - 优化Web界面
    - 添加 Kissy Pie 分支

## v0.4.0

    - 目录结构升级
    - 添加Web界面 (preview)

### 目录结构升级到 v2.0
#### 新的目录结构

page/version 目录下面的core 改名为 page, mods 移除， page目录下的子目录既模块文件

````
- app                           // root of app
    ├ common                    // 通用脚本与样式， 可直接引用，独立打包
    ├ utils                     // 通用组件, 使用时打包入Page使用, 一般不单独引用
    │   ├ countdown
    │   │   ├ index.js
    │   │   └ countdown-mod.js
    │   └ text-formater
    ├ homepage                  // Page 目录
    │   ├ 1.0                   // Page 版本 目录
    │   │   ├ test              // 测试用例 目录
    │   │   ├ page              // Page 的入口文件目录, 打包，引用的入口
    │   │   │   ├ base.js
    │   │   │   ├ style1.css
    │   │   │   ├ style2.less
    │   │   │   └ mods          // page目录的子目录为模块目录
    │   │   │       ├ mod1.js
    │   │   │       ├ mod2.js
    │   │   │       ├ mod3.js
    │   │   │       ├ mod1.css
    │   │   │       └ mod2.css
    │   │   ├ fb-build.sh       // 打包快捷方式
    │   │   ├ fb-build.bat      // 打包快捷方式
    │   │   └ fb.page.json      // Page 相关配置
    │   └ 20121221              // 打包后的时间戳目录
    │       ├ build.json        // 打包信息
    │       └ page              // 打包只处理core目录，生成-min.js 的压缩版本
    │           ├ base.js
    │           ├ base-min.js
    │           ├ style1.css
    │           ├ style1-min.css
    │           ├ style2.css
    │           └ style2-min.css
    └ fb.json                   // 应用的配置, fb 应用根路径的标识
````

#### 老的目录结构

````
- app                           // root of app
    ├ common                    // 通用脚本与样式， 可直接引用，独立打包
    ├ utils                     // 通用组件, 使用时打包入Page使用, 一般不单独引用
    │   ├ countdown
    │   │   ├ index.js
    │   │   └ countdown-mod.js
    │   └ text-formater
    ├ homepage                  // Page 目录
    │   ├ 1.0                   // Page 版本 目录
    │   │   ├ test              // 测试用例 目录
    │   │   ├ core              // Page 的入口文件目录, 打包，引用的入口
    │   │   │   ├ base.js
    │   │   │   ├ style1.css
    │   │   │   └ style2.less
    │   │   ├ mods              // Page的模块目录
    │   │   │    ├ mod1.js
    │   │   │    ├ mod2.js
    │   │   │    ├ mod3.js
    │   │   │    ├ mod1.css
    │   │   │    └ mod2.css
    │   │   ├ fb-build.sh       // 打包快捷方式
    │   │   ├ fb-build.bat      // 打包快捷方式
    │   │   └ fb.page.json      // Page 相关配置
    │   └ 20121221              // 打包后的时间戳目录
    │       ├ build.json        // 打包信息
    │       └ core              // 打包只处理core目录，生成-min.js 的压缩版本
    │           ├ base.js
    │           ├ base-min.js
    │           ├ style1.css
    │           ├ style1-min.css
    │           ├ style2.css
    │           └ style2-min.css
    └ fb.json                   // 应用的配置, fb 应用根路径的标识
````

### 添加Web界面

     通过fb web 打开 FB 的 web 界面， 在web界面中可以执行打包等任务

## v0.3.9

    - 添加 css lint
    - 添加 目录监控功能

### CSSLint &times; FB

FB 打包开始前会对你的源码进行Lint， 并在命令台中显示出来

````sh
$ fb build page1/1.0 -t 20121212

#...
plugin: csslint

csslint: There are 1 problems in core/index.css.

index.css
1: warning at line 4, col 1
Element (index.css) is overqualified, just use .css without element name.
index.css {display: block;}

csslint: There are 1 problems in mods/a.css.
#...

````

### 目录监控 &times; FB

在build 命令之后添加 -w 或 --watch

FB 会进入自动监控模式。

每次对应page里面的文件修改后， FB自动对你的Page进行打包

````sh
$ fb build page1/1.0 -t 20121212 -w

building page1@1.0 to 20121212
#...
plugin: lesscss
plugin: concat
plugin: uglifyjs
plugin: cssmin
build end
watching...
````