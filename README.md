# Kissy Pie (ki)

[![build status](https://secure.travis-ci.org/maxbbn/front-build.png)](http://travis-ci.org/maxbbn/front-build)


## 她是什么？

KissyPie是面向前端的自动化开发环境。

- 能帮助你初始化，检查，打包，压缩你的前端代码（包括css, js, less)；
- 基于一套目录结构规范, 特点是：
    - 模块化（Kissy Module Compile, Css-Combo，　Less　的引入, 提供高度模块化支持）
    - 可括展性 (将应用拆分为Page，　方便应用的扩展)
    - 适度灵活 (Common目录可直接引用)
    - 可复用,　应用的　Utils　目录提供跨Page的代码可复用，　CommonLib 提供跨应用的代码复用
    - 安全性，发布基于时间戳目录提供了与后端的解耦, 以Page为单位可隔离风险。
- 友好的交互界面，　快速的打包

是时候和Ant说再见了！

[目录结构样例](https://github.com/maxbbn/front-build/tree/kissy-pie-m/sample-project)

## 适用场景

- 基于 kissy1.2+ 的新项目或新应用
- 将你的老应用迁移至 Kissy Pie

## 快速开始

### 安装 Kissy Pie

1. 首先安装或升级 Node.js (0.8.x) http://nodejs.org/
2. 命令行执行 `npm install kissy-pie -g`　安装
3. done!

### 使用 Kissy Pie
1. 进入你应用的　Assets目录，　执行命令 `ki init`
2. 命令行执行 `ki web`　打开可视化界面，　或使用命令行工具
3. enjoy!

### 更新 Kissy Pie

1. npm update kissy-pie -g
2. done!


## 使用
你可以通过界面或命令行来使用　Kissy　Pie

### 界面

你可以在命令行中使用 `ki web` 来启动基于浏览器的可视界面。

![ 应用视图 ](http://farm9.staticflickr.com/8454/7886120632_ca6762affa_b.jpg)

![ Page视图 ](http://farm9.staticflickr.com/8454/7886122594_1b457cc29c_b.jpg)

### 命令列表

<table>
    <thead>
        <tr>
            <td>命令</td>
            <td>简介</td>
            <td>示例</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>init</td>
            <td>初始化一个应用， 请在应用Assets根目录下执行。</td>
            <td><code>ki init</code></td>
        </tr>
        <tr>
            <td>update</td>
            <td>更新或修复你的当前应用</td>
            <td><code>ki update</code></td>
        </tr>
        <tr>
            <td>web</td>
            <td>开启本地Web服务器，从浏览器访问 http://127.0.0.1:8765<br>
                可在一个可视化界面里面执行常用的操作，如打包，添加新的Page或Version等。 <br>
                如果在应用目录下执行， 可直达当前应用。<br>
            </td>
            <td><code>ki web</code></td>
        </tr>
        <tr>
            <td>add</td>
            
            <td>创建一个Page或版本</td>
            
            <td><code>ki add home/1.0</code></td>
        </tr>
        <tr>
            <td>build</td>
            
            <td>打包一个版本到时间戳目录</td>
            
            <td>
                <code>ki build samplepage/1.0 -t 20121221</code><br>
                打包一个Page<br><br>
                
                <code>ki build samplepage/1.0 samplepage2/1.0 -t 20121221</code><br>
                打包多个page<br><br>
                
                <code>ki build samplepage/1.0 -t 20121221 -w</code><br>
                加参数<code>-w</code> 或 <code>--watch</code> 可以监视目录变更，　代码有更新会自动打包<br><br>
                
                <code>ki build common</code><br>
                打包Common目录<br><br>
            </td>
        </tr>

        <tr>
            <td>group</td>

            <td>
                将多个Page加入一个组可以方便的批量打包到一个时间戳。
            </td>
            
            <td>
                <code>ki group set front home/1.0 about/1.0 </code><br>
                设置一个 'front' 组<br><br>
                
                <code>ki group add front home/1.0 about/1.0</code><br>
                添加Page到现有的'front'组<br><br>
                
                <code>ki group list|show front</code><br>
                显示　'front' 组<br><br>
                
                <code>ki group</code><br>
                显示所有的组<br><br>
                
                <code>ki group build front -t 20121221</code><br>
                打包　'front' 组到时间戳<br><br>
                
                <code>ki group rm front</code><br>
                删除 'front' 组<br><br>
            </td>
        </tr>

    </tbody>
</table>





## 相关资料
-　[《使用Kissy Pie快速构建—kissy1.2最佳实践探索》](http://www.36ria.com/5536)
-  [ KissyPie 使用教程（视频） ](http://v.youku.com/v_show/id_XNDQ3NjQ4MDA0.html) 

## 依赖

- css-combo https://github.com/daxingplay/css-combo
- iconv-lite https://github.com/ashtuchkin/iconv-lite
- tbuild https://github.com/czy88840616/tbuild
- less.js http://lesscss.org
- cssmin 
- uglifyjs https://github.com/mishoo/UglifyJS
- csslint http://csslint.net
- expressjs http://expressjs.org


## 兼容性

* node 0.8.x +
* window xp +
* OSX 10.7 +