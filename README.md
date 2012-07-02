# Front-Build

    - 基于目录规范
    - 自动化打包，追求零配置
    - 面向前端


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
    └ fb.json                   // 应用的配置, fb 应用根路径的标识
````

## FB如何构建你的代码

### 应用的 page 构建


#### fb使用以下步骤构建 page

特点
    - 发布基于时间戳目录
    - core 目录是编译入口
    - 开发环境与生产环境灵活切换

    1. 创建目录 临时src (page.srcDir); 临时build (page.destDir); timestame目录
    2. 将版本目录里面的文件，转成utf8编码， 并全部拷贝到 src 目录
    3. 使用内置插件系统
    
        1. module-compiler: KISSY的模块打包， 从src/core/xx.js -> build/core/xx.js
        2. css-combo: css打包， 从src/core/xx.css -> build/core/xx.css
        3. lesscss:  打包， 从 src/core/xx.less -> build/core/xx.less.css
        4. concat: 根据配置合并文件
        5. uglifyjs: build/core/xx.js -> build/core/xx-min.js
        6. cssmin: build/core/xx.css -> build/core/xx-min.css
        
    4. 将build下的所有文件转码到outputCharset，并复制到timestamp目录
    5. 在timestamp 目录下生成 包含打包信息的 build.json.



### 应用的 common 构建

特点
    - common 根目录下的文件为打包入口
    - 可在 fb.json 里面配置文件编码

    1. 创建目录: 临时src (common.srcDir); 临时build (common.destDir);
    2. 将common目录里面源码文件，从 inputCharset 转成utf8编码， 并全部拷贝到 临时src 目录
    3. 使用内置插件系统
    
        1. module-compiler: KISSY的模块打包压缩， 从src/*xx.js* -> build/*xx-min.js*
        2. lesscss:  打包， 从 src/*xx.less* -> build/*xx-min.css*
        3. uglifyjs: *build*/*xx.js* -> build/*xx-min.js*
        4. cssmin: *build*/*xx.css* -> build/*xx-min.css*
        
    4. 将临时build 目录下的 **-min.** 等压缩文件从 utf-8 转码到 outputCharset，并复制回 common目录

#### 注意点
    - common 目录的 outputCharset === inputCharset, 可在 fb.json 里面配置 charset
    - 可在app 里面执行 fb build common


### utils 构建

utils 一般不直接使用， 可打包进page。 


## 快速开始

### 安装

    1. 首先安装nodejs环境 (and npm) http://nodejs.org/#download;
    2. npm install front-build -g;
    3. done!

### 更新

    1. npm update front-build -g
    2. done!


````sh
cd dir/to/app
fb init
````
初始化当前文件夹为Root， 请在项目根目录下执行。

如果已有fb.json 不必重复执行。

````sh
cd dir/to/app
fb update
````
更新fb项目到最新版本

此命令会更新fb.json， 在其中添加新版本的一些配置信息。

同时会创建缺失的文件夹。

````sh
fb add name_of_page
````
在应用里面创建一个Page。在应用目录内执行



````sh
fb version 1.0
#or
fb ver 1.0
````

在page文件夹里面执行, 为当前Page 创建一个Version


````sh
fb build about@1.0 -t 20120601
````

构建 1.0(Version) 的 about(当前PageName) 到时间戳目录 ‘20120601’


一次构建多个页面
````sh
fb build about@1.0 index@1.0 -t 20120601
````

或者使用组（group)

````sh
fb group set front-page about@1.0 index@1.0
fb group build front-page -t 20120601
# 其它group 命令

fb group
fb group list ## 列出所有组
fb group rm front-page ##删除一个组
fb group add front-page home@2.0 ## 追加一个version 到组
````
_注意_ 一个组里面只能包含一个Page的一个version；


common 目录构建

````sh
fb build common
````

## 兼容性
  * window xp +
  * linux
  * OSX 10.7 +