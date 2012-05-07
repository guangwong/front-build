# Front-Build
一个基于约定的前端打包工具, 能完成less 编译。kissy 脚本自动合并，压缩。

## 安装
    - 首先安装nodejs (and npm);
    - npm install front-build
    - done!

## 兼容性

## 用法

### fb init
初始化一个项目文件夹

### fb add [pagename]
创建一个Page

### fb version [pagename]
在page文件夹里面执行
创建一个version

### fb build {pagename} -v {version} -t {timestame}
打包{version} 目录 {timestamp} 目录

会自动编译core 目录下面的less 文件到 打包目录的 core目录
会自动打包core目录下的kissy1.2入口文件到core目录, 并生成一个-min.js压缩版

如果你在当前的工作目录是 在 page 的一个版本里面， 你可以不用指定{pagename} 和 -v

````sh
fb build -t {timestamp}
````
