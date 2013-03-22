# Kissy Pie (ki)

[![build status](https://secure.travis-ci.org/maxbbn/front-build.png)](http://travis-ci.org/maxbbn/front-build)

## 她是什么？

KissyPie 是面向前端的自动化开发环境。

- 能帮助你初始化，检查，打包，压缩你的应用的前端代码（包括css, js, less)；
- 基于一套目录结构约定, 特点是：
    - 模块化（Kissy Module Compile, Css-Combo，　Less　的引入, 提供高度模块化支持）
    - 可括展性 (将应用拆分为Page，　方便应用的扩展)
    - 适度灵活 (Common目录可直接引用)
    - 可复用,　应用的　[Utils目录](/maxbbn/front-build/wiki/utils-目录) 提供跨Page的代码可复用，　CommonLib 提供跨应用的代码复用
    - 安全性，发布基于时间戳目录提供了与后端的解耦, 以Page为单位可隔离风险。
- 友好的交互界面，支持命令行及图形界面

## 适用场景

- 基于 kissy1.2+ 的新项目或新应用
- 将你的老应用迁移至 Kissy Pie

## 安装 Kissy Pie

### 方式一： 通过 npm 安装
1. 首先安装或升级 Node.js ( 0.8.x) http://nodejs.org/
2. 命令行执行 `npm install kissy-pie -g`　安装

### 方式二： 通过源码安装
1. 检出代码库 `git checkout https://github.com/maxbbn/front-build.git`
2. `cd front-build`
3. `npm link`


## 更新 Kissy Pie

1. npm update kissy-pie -g
2. done!


## 快速开始使用

> 如果第一次使用， 应先初始化你的目录：
>   进入你应用的　Assets目录，　执行命令 `ki init`


命令行执行 `ki web`　可打开可视化界面


![ 应用视图 ](http://farm9.staticflickr.com/8454/7886120632_ca6762affa_b.jpg)

![ Page视图 ](http://farm9.staticflickr.com/8454/7886122594_1b457cc29c_b.jpg)

## 帮助文档

- [KissyPie 命令列表](https://github.com/maxbbn/front-build/wiki/Command)
- [在VM模版中使用 KissyPie 详解](https://github.com/maxbbn/front-build/wiki/Use-Kissy-Pie-with-VM)
- [一个基于KissyPie的应用样例] (https://github.com/maxbbn/front-build/tree/kissy-pie-m/server/public/assets/)

## 相关资料
- [《使用Kissy Pie快速构建—kissy1.2最佳实践探索》](http://www.36ria.com/5536)
- [ KissyPie 使用教程（视频） ](http://v.youku.com/v_show/id_XNDQ3NjQ4MDA0.html) 

## 依赖

- css-combo https://github.com/daxingplay/css-combo
- iconv-lite https://github.com/ashtuchkin/iconv-lite
- tbuild https://github.com/czy88840616/tbuild
- less.js http://lesscss.org
- clean-css https://github.com/GoalSmashers/clean-css
- uglifyjs https://github.com/mishoo/UglifyJS
- csslint http://csslint.net
- expressjs http://expressjs.org


## 兼容性

* node 0.8.x +
* window xp +
* OSX 10.7 +
