# Front-Build
- 基于目录规范
- 自动化打包
- 零配置


## 目录规范

````
- app                           // root of app
    ├ common                    // 通用脚本， 可直接引用，独立打包
    ├ utils                     // 通用组件, 使用时打包入page使用
    │   ├ countdown 
    │   │   ├ index.js
    │   │   └ countdown-mod.js
    │   └ text-formater
    └ homepage                  // page 目录
        ├ 1.0                   // page 版本 目录
        │   ├ test              // 测试用例 目录
        │   ├ fb.version.json   // page 相关配置
        │   ├ build.sh          // 打包快捷方式
        │   ├ core              // page 的入口文件目录, 打包，引用的入口
        │   │   ├ base.js
        │   │   ├ style1.css
        │   │   └ style2.less
        │   └ mods              // page的模块目录
        │        ├ mod1.js
        │        ├ mod2.js
        │        ├ mod3.js
        │        ├ mod1.css
        │        └ mod2.css
        └ 20121221              // 打包后的时间戳目录 
            ├ build.json        // 打包信息
            └ core              // 打包只处理core目录，生成-min.js 的压缩版本
                ├ base.js
                ├ base-min.js
                ├ style1.css
                ├ style1-min.css
                ├ style2.css
                └ style2-min.css
````


## 安装
    - 首先安装nodejs环境 (and npm);
    - npm install front-build
    - done!


## 用法

### 初始化一个应用

````sh
cd dir/to/app
fb init
````

初始化一个项目文件夹为Root

### 创建一个 Page

````sh
fb add name_of_page
````

在应用里面创建一个Page。在应用目录内执行

### 为Page创建一个 Version

````sh
fb version version_of_your_page
````
or

````sh
fb ver 1.0
````

在page文件夹里面执行, 为当前Page 创建一个version

### 打包

#### 单个page打包

````sh
fb build {pagename}@{version} -t {timestame}
````

a sample

````sh
fb build about@1.0 -t 20120601
````
我们是如何打包的[链接]；

### 多个page 打包

````sh
fb build all
````

````sh
fb build all
````
## Bugs
## 兼容性