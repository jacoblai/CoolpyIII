module.exports.contains = function (needle) {
    var findNaN = needle !== needle;
    var indexOf;
    if (!findNaN && typeof Array.prototype.indexOf === 'function') {
        indexOf = Array.prototype.indexOf;
    } else {
        indexOf = function (needle) {
            var i = -1, index = -1;
            for (i = 0; i < this.length; i++) {
                var item = this[i];
                if ((findNaN && item !== item) || item === needle) {
                    index = i;
                    break;
                }
            }
            return index;
        };
    }
    return indexOf.call(this, needle) > -1;
};