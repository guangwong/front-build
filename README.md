# Kissy Pie (ki)

## 她是什么？

KissyPie是面向前端的自动化开发环境。是时候和　Ant 说再见了！

- 能帮助你初始化，检查，打包，压缩你的前端代码（包括css, js, less)；
- 基于一套目录结构规范, 特点是：
    - 模块化（Kissy Module Compile, Css-Combo，　Less　的引入, 提供高度模块化支持）
    - 可括展性 (将应用拆分为Page，　方便应用的扩展)
    - 适度灵活 (Common目录可直接引用)
    - 可复用,　应用的　Utils　目录提供跨Page的代码可复用，　CommonLib 提供跨应用的代码复用
    - 安全性，发布基于时间戳目录提供了与后端的解耦, 以Page为单位可隔离风险。
- 友好的交互界面，　快速的打包

[目录结构样例](https://github.com/maxbbn/front-build/tree/kissy-pie-m/sample-project)

## 适用场景

- 基于 kissy1.2+ 的新项目或新应用
- 将你的老应用迁移至 Kissy Pie

## 快速开始

### 安装 Kissy Pie

1. 首先安装 nodejs 环境 (and npm) http://nodejs.org/#download
2. npm install kissy-pie -g
3. done!

### 使用 Kissy Pie
1. 进入你应用的assets目录，　执行命令 `ki init`
2. 执行 `ki web`　打开可视化界面
3. enjoy!

### 更新 Kissy Pie

1. npm update front-build -g
2. done!


## 使用
你可以通过界面或命令行来使用　Kissy　Pie

### 界面

你可以在命令行中使用 `ki web` 来启动基于浏览器的可视界面。

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
            <td>初始化， 请在应用Assets根目录下执行。</td>
            <td><code>ki init</code></td>
        </tr>
        <tr>
            <td>update</td>
            <td>Kissy Pie 更新或修复你的当前应用</td>
            <td></td>
        </tr>
        <tr>
            <td>web</td>
            <td>开启本地Web服务器，从浏览器访问 http://127.0.0.1:8765<br>
                可在一个可视化界面里面执行常用的操作，如打包，添加新的Page或Version等。 <br>
                如果在应用目录下执行， 可直达当前应用。<br>
            </td>
            <td><code>ki web</code>›</td>
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
                
                <code>ki build samplepage/1.0</code><br>
                不指定timestamp 将���打包到最近的一次打包目录<br><br>
                
                <code>ki build samplepage/1.0 -t 20121221 -w</code><br>
                加参数<code>-w</code> 或 <code>--watch</code> 可以监视目录变更，　代码有更新会自动打包<br><br>
                
                <code>ki build common</code><br>
                打包Common目录<br><br>
            </td>
        </tr>

        <tr>
            <td>group</td>

            <td>
                可以通过ki group build {groupname}方便执行批量操作 <br>
                _注意_ 一个组里面只能包含一个Page的一个version；
            </td>
            
            <td>
                <code>ki group set front home/1.0 about/1.0 </code><br>
                设置一个组<br><br>
                
                <code>ki group add {groupname} [{pagename}/{version}]...</code><br>
                添加Page到现有的组<br><br>
                
                <code>ki group list|show {groupname}</code><br>
                显示一个组包含的Page<br><br>
                
                <code>ki group</code><br>
                显示所有的组<br><br>
                
                <code>ki group build front -t 20121221</code><br>
                打包一个组里的所有page到时间戳<br><br>
                
                <code>ki group rm front</code><br>
                删除一个组<br><br>
            </td>
        </tr>

    </tbody>
</table>





## 相关资料
－　[《使用Kissy Pie快速构建—kissy1.2最佳实践探索》](http://www.36ria.com/5536)

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