# Front-Build
- 基于目录规范
- 自动化打包
- 零配置


## 目录规范

````
- app                           // root of app
    ├ common                    // 通用脚本与样式， 可直接引用，独立打包
    ├ utils                     // 通用组件, 使用时打包入page使用, 一般不单独引用
    │   ├ countdown
    │   │   ├ index.js
    │   │   └ countdown-mod.js
    │   └ text-formater
    ├ homepage                  // page 目录
    │   ├ 1.0                   // page 版本 目录
    │   │   ├ test              // 测试用例 目录
    │   │   ├ core              // page 的入口文件目录, 打包，引用的入口
    │   │   │   ├ base.js
    │   │   │   ├ style1.css
    │   │   │   └ style2.less
    │   │   ├ mods              // page的模块目录
    │   │   │    ├ mod1.js
    │   │   │    ├ mod2.js
    │   │   │    ├ mod3.js
    │   │   │    ├ mod1.css
    │   │   │    └ mod2.css
    │   │   ├ fb-build.sh       // 打包快捷方式
    │   │   ├ fb-build.bat      // 打包快捷方式
    │   │   └ fb.page.json      // page 相关配置
    │   └ 20121221              // 打包后的时间戳目录
    │       ├ build.json        // 打包信息
    │       └ core              // 打包只处理core目录，生成-min.js 的压缩版本
    │           ├ base.js
    │           ├ base-min.js
    │           ├ style1.css
    │           ├ style1-min.css
    │           ├ style2.css
    │           └ style2-min.css
    └ fb.json                   // 应用的配置
````

## fb 如何构建你的代码

## page
### 特点
-  基于时间戳目录
-  从入口文件（core 目录）开始

##@ fb使用以下步骤构建
  1. 创建临时目录 src (page.srcDir) build (page.destDir).
  2. 将版本目录里面的文件，转成utf8编码， 并全部拷贝到 src 目录
  3. 


## common

## utils

## 安装
    - 首先安装nodejs环境 (and npm);
    - npm install front-build
    - done!


## 快速开始

初始化一个应用

初始化一个项目文件夹为Root
````sh
cd dir/to/app
fb init
````

创建一个 Page

在应用里面创建一个Page。在应用目录内执行


````sh
fb add name_of_page
````

为Page创建一个 Version

在page文件夹里面执行, 为当前Page 创建一个version

````sh
fb version version_of_your_page
````
or

````sh
fb ver 1.0
````


### 构建

单个page构建

````sh
fb build {pagename}@{version} -t {timestame}
````

sample:

````sh
fb build about@1.0 -t 20120601
````

我们是如何打包的[链接]；

构建所有页面

````sh
fb build all -t 20121221
````
同时构建多个page

````sh
fb build pagea@1.0 pageb@2.0 pagec@1.0 -t 20121221

common 目录构建

````sh
fb build common
````

## Bugs
## 兼容性