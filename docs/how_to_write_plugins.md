# Plugins 
## sample
````javascript
module.exports = function() {
    return function (page, next) {
        page.temp_src_dir;
        page.temp_build_dir;
        next();
    }
}
````