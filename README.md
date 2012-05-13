# Front-Build
- 约定高于配置
- 面向前端


## 目录
### Root
### Common
### Page 目录
### Version 目录
#### core
#### mods
#### utils
### Build 目录


## 安装
    - 首先安装nodejs环境 (and npm);
    - npm install front-build
    - done!

## 兼容性

## 用法

### fb init
初始化一个项目文件夹， 只有在Root目录里才能执行下面的命令

### fb add {pagename}
创建一个Page

### fb version {versionNumber}
在page文件夹里面执行
为当前Page 创建一个version

### fb build {pagename} -v {version} -t {timestame}
打包{version} 目录 {timestamp} 目录

会自动编译core 目录下面的less 文件到 打包目录的 core目录
会自动打包core目录下的kissy1.2入口文件到core目录, 并生成一个-min.js压缩版

````sh
fb build -t {timestamp}
````
## Bug