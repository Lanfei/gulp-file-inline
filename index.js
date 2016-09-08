'use strict';

var fs = require('fs');
var url = require('url');
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var UglifyJS = require("uglify-js");
var CleanCSS = require('clean-css');

var PLUGIN_NAME = 'gulp-file-inline';

var CSS_TAG_PATTERN = /<link[^>]* href=[^>]+>/ig;
var JS_TAG_PATTERN = /<script[^>]* src=[^>]+>(\s|\n)*<\/script>/ig;

var ATTR_PATTERN = / [^>]+?(?=(\s*\/>|>))/;

var CSS_HREF_PATTERN = / href=['"]?([^'"]+)['"]?/i;
var JS_SRC_PATTERN = / src=['"]?([^'"]+)['"]?/i;

var CSS_URL_PATTERN = /(url\(['"]?)([^'")]+)(['"]?\))/g;

var defOpts = {
	css: {
		tagPattern: CSS_TAG_PATTERN,
		urlPattern: CSS_HREF_PATTERN,
		tagParser: cssTagParser,
		parser: cssParser,
		minify: true
	},
	js: {
		tagPattern: JS_TAG_PATTERN,
		urlPattern: JS_SRC_PATTERN,
		tagParser: jsTagParser,
		parser: jsParser,
		minify: true
	}
};

function inline(base, reference, html, encoding, filter, tagPattern, urlPattern, tagParser, parser, minify) {
	html = html.replace(tagPattern, function (tag) {
		if (filter && !filter(tag)) {
			return tag;
		}
		var codes, attrCodes = '';
		tag.replace(ATTR_PATTERN, function (attr) {
			attrCodes = attr.replace(urlPattern, function (match, urlStr) {
				var urlObj = url.parse(urlStr);
				if (urlObj.protocol) {
					return attr;
				}
				var filename = path.join(base, urlObj.pathname);
				var relative = path.relative(base, filename);
				if (fs.existsSync(filename) && fs.statSync(filename).isFile()) {
					codes = parser(base, filename, encoding, minify);
					gutil.log(PLUGIN_NAME + ':', 'Inline', gutil.colors.green(relative), '->', gutil.colors.green(reference));
				} else {
					codes = '';
					gutil.log(PLUGIN_NAME + ':', 'Missing', gutil.colors.red(relative));
				}
				return '';
			});
		});
		if (codes !== undefined) {
			tag = tagParser(codes, attrCodes);
		}
		return tag;
	});
	return html;
}

function cssParser(base, filename, encoding, minify) {
	var dirname = path.dirname(filename);
	var source = fs.readFileSync(filename).toString(encoding);
	source = source.replace(CSS_URL_PATTERN, function (match, openCodes, urlStr, closeCodes) {
		var urlObj = url.parse(urlStr);
		if (urlObj.protocol || path.isAbsolute(urlStr)) {
			return match;
		}
		return openCodes + path.relative(base, path.join(dirname, urlStr)) + closeCodes;
	});
	if (minify) {
		return new CleanCSS().minify(source).styles;
	} else {
		return source;
	}
}

function jsParser(base, filename, encoding, minify) {
	var source = fs.readFileSync(filename).toString(encoding);
	if (minify) {
		return UglifyJS.minify(source, {fromString: true}).code;
	} else {
		return source;
	}
}

function cssTagParser(codes, attrCodes) {
	attrCodes = attrCodes.replace(' rel="stylesheet"', '');
	return '<style' + attrCodes + '>' + codes + '</style>';
}

function jsTagParser(codes, attrCodes) {
	attrCodes = attrCodes.replace(' type="text/javascript"', '');
	return '<script' + attrCodes + '>' + codes + '</script>';
}

function merge(objA, objB) {
	var target = {};
	forEach(objA, function (item, key) {
		target[key] = item;
	});
	forEach(objB, function (item, key) {
		target[key] = item;
	});
	return target;
}

function forEach(obj, iterator) {
	var keys = Object.keys(obj);
	for (var i = 0, l = keys.length; i < l; ++i) {
		var key = keys[i];
		iterator.call(obj, obj[key], key);
	}
}

function fileInline(opts) {
	opts = merge(defOpts, opts || {});

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			return cb();
		} else if (file.isStream()) {
			cb(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
		} else if (file.isBuffer()) {
			var base = path.dirname(file.path);
			var html = file.contents.toString();
			var reference = file.relative;
			forEach(opts, function (opt, type) {
				if (!opt) {
					return;
				}
				var defOpt = defOpts[type] || {};
				html = inline(
					base, reference, html, enc,
					opt.filter,
					opt.tagPattern || defOpt.tagPattern,
					opt.urlPattern || defOpt.urlPattern,
					opt.tagParser || defOpt.tagParser,
					opt.parser || defOpt.parser,
					opt.minify === undefined ? defOpt.minify : opt.minify
				);
			});
			file.contents = new Buffer(html);
			cb(null, file);
		}
	});
}

exports = module.exports = fileInline;
exports.CSS_TAG_PATTERN = CSS_TAG_PATTERN;
exports.JS_TAG_PATTERN = JS_TAG_PATTERN;
exports.CSS_HREF_PATTERN = CSS_HREF_PATTERN;
exports.JS_SRC_PATTERN = JS_SRC_PATTERN;
exports.cssTagParser = cssTagParser;
exports.jsTagParser = jsTagParser;
exports.cssParser = cssParser;
exports.jsParser = jsParser;
