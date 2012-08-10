# Kissy Pie (ki)

- 基于目录规范
- 自动化打包，追求零配置
- 面向前端

## v0.4.2 ~ v0.4.5

- bugfixes
    * 在转码时，忽略 .svn 目录
    * css-combo 升级到0.2.4
- 添加打包信息的展示，出错详细信息展示， 升级的Web界面
- 添加全局配置， 配置文件放在用户目录
- 添加 tools 目录下的命令快捷方式， 如打开Web界面，或升级修复应用
- 在应用目录下执行 ki web 或 tools/web-client.bat(sh) 可直接在浏览器中打开应用

## 相对于ant，Kissy Pie的优势
<img src="http://www.36ria.com/wp-content/uploads/2012/07/FBvsAnt.png" />


## 特别适合使用 Kissy Pie 的场景

- 基于 kissy1.2 的新项目或新应用
- 重构应用前端代码

## 快速开始
### 安装 Kissy Pie

1. 首先安装nodejs环境 (and npm) http://nodejs.org/#download
2. npm install kissy-pie -g
3. done!

### 更新 Kissy Pie

1. npm update front-build -g
2. done!

了解更多：<a href="http://www.36ria.com/5536" target="_blank">《使用Kissy Pie快速构建—kissy1.2最佳实践探索》</a>

## 目录结构样例

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
    │       └ page              // 打包只处理page目录，生成-min.js 的压缩版本
    │           ├ base.js
    │           ├ base-min.js
    │           ├ style1.css
    │           ├ style1-min.css
    │           ├ style2.css
    │           └ style2-min.css
    └ fb.json                   // 应用的配置, fb 应用根路径的标识

````

## 目录结构说明

- 一个应用包含一个Common， 一个Utils目录，和多个 Page。
- Common 目录是应用通用脚本和样式。 通常被会被多个 Page 使用， 使用方式为被页面直接使用。
- Page 是以页面的维度划分的, Page 分版本，支持多版本共存；每次打包生成新的时间戳目录；版本目录和时间戳在同一目录下，通过文件名区分。
- Utils 是应用的通用的工具或组件类脚本和样式， 通常在开发阶段由Page通过Loader加载使用，上线后由 Kissy Pie 工具打包入 Page 的文件中来减小请求数。

## Kissy Pie如何构建你的代码

### 应用的 Page 构建

1. 创建目录 临时 src (Page.srcDir); 临时 build (Page.destDir); timestame 目录
2. 将版本目录里面的文件，转成utf8编码， 并全部拷贝到 src 目录
3. 使用内置插件系统
    1. module-compiler: KISSY的模块打包， 从src/page/xx.js -> build/page/xx.js
    2. kissy-template: Kissy Template 模版编译，由 src/page/../xx.tpl.html 编译成 src/page/../xx.tpl.js
    2. css-combo: css打包， 从src/page/xx.css -> build/page/xx.css
    3. lesscss:  打包， 从 src/page/xx.less -> build/page/xx.less.css
    4. concat: 根据配置合并文件
    5. uglifyjs: build/page/xx.js -> build/page/xx-min.js
    6. cssmin: build/page/xx.css -> build/page/xx-min.css
4. 将build下的所有文件转码到outputCharset，并复制到timestamp目录
5. 在timestamp 目录下生成 包含打包信息的 build.json.

特点

- 发布基于时间戳目录
- page *根目录文件* 是编译入口
- 开发环境与生产环境灵活切换 (通过KISSY.Config.debug开关)

### 应用的 common 构建

1. 创建目录: 临时src (common.srcDir); 临时build (common.destDir);
2. 将common目录里面源码文件，从 inputCharset 转成utf8编码， 并全部拷贝到 临时src 目录
3. 使用内置插件系统
    1. module-compiler: KISSY的模块打包压缩， 从src/*xx.js* -> build/*xx-min.js*
    2. lesscss:  打包， 从 src/*xx.less* -> build/*xx-min.css*
    3. uglifyjs: *build*/*xx.js* -> build/*xx-min.js*
    4. cssmin: *build*/*xx.css* -> build/*xx-min.css*
4. 将临时build 目录下的 **-min.** 等压缩文件从 utf-8 转码到 outputCharset，并复制回 common目录
    
特点

- common *根目录下的文件* 为打包入口
- 可在 fb.json 里面配置文件编码

#### 注意点

- common 目录的 outputCharset === inputCharset, 可在 fb.json 里面配置 charset
- 可在app 里面执行 fb build common


### utils 构建

utils 一般不直接使用， 可打包进Page。 

## 常用命令介绍

### ki init

````sh
cd dir/to/app
ki init
````
初始化当前文件夹为Root， 请在项目根目录下执行。

如果已有fb.json 不必重复执行。

### ki update

````sh
cd dir/to/app
ki update
````
Kissy Pie 升级后，更新本地项目到最新版本

此命令会更新 fb.json， 在其中添加新版本的一些配置信息。

同时会创建缺失的文件夹。

### ki web

开启本地Web服务器，从浏览器访问 http://127.0.0.1:8765

如果在应用下执行， 可在界面中直达当前应用。

强烈推荐！！可在一个可视化界面里面执行常用的操作，如打包，添加新的Page或Version等。 

### ki add

````sh
ki add name_of_page/1.0
````
在应用里面创建或初始化 版本 为 "1.0" 的Page "name_of_page"

### ki build
````sh
ki build about@1.0 -t 20120601
````

构建 1.0(Version) 的 about(当前PageName) 到时间戳目录 ‘20120601’

如果不指定 -t, Kissy Pie会自动打包到最新的时间戳目录

一次构建多个页面

````sh
## 同时指定多个page
ki build about@1.0 index@1.0 -t 20120601
````
common 目录构建

````sh
ki build common
````

或者使用组（group)

### ki group command

````sh
ki group set group1 about@1.0 index@1.0
ki group build group1 -t 20120601

````

其它group 命令

````sh
ki group
ki group list ## 列出所有组
ki group rm front-page ##删除一个组
ki group add front-page home@2.0 ## 追加一个version 到组
````

_注意_ 一个组里面只能包含一个Page的一个version；


## 依赖的包

- css-combo https://github.com/daxingplay/css-combo
- iconv-lite https://github.com/ashtuchkin/iconv-lite
- tbuild https://github.com/czy88840616/tbuild
- less.js http://lesscss.org
- cssmin 
- uglifyjs https://github.com/mishoo/UglifyJS
- csslint http://csslint.net


## 兼容性

* node 0.8.x +
* window xp +
* OSX 10.7 +