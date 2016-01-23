'use strict';

var fs = require('fs');
var url = require('url');
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var UglifyJS = require("uglify-js");
var CleanCSS = require('clean-css');

const PLUGIN_NAME = 'gulp-file-inline';

const CSS_TAG_PATTERN = /<link[^>]* href=[^>]+>/g;
const JS_TAG_PATTERN = /<script[^>]* src=[^>]+>(.|\n)*<\/script>/g;

const ATTR_PATTERN = / [^>]+?(?=(\s*\/>|>))/;

const CSS_HREF_PATTERN = / href=['"]?([^'"]+)['"]?/;
const JS_SRC_PATTERN = / src=['"]?([^'"]+)['"]?/;

const CSS_URL_PATTERN = /(url\(['"]?)([^'")]+)(['"]?\))/g;

const CSS_INLINE_TAG = 'style';
const JS_INLINE_TAG = 'script';

var defOpts = {
	css: {
		tagPattern: CSS_TAG_PATTERN,
		urlPattern: CSS_HREF_PATTERN,
		inlineTag: CSS_INLINE_TAG,
		parser: cssParser,
		minify: true
	},
	js: {
		tagPattern: JS_TAG_PATTERN,
		urlPattern: JS_SRC_PATTERN,
		inlineTag: JS_INLINE_TAG,
		parser: jsParser,
		minify: true
	}
};

function inline(html, base, filter, tagPattern, urlPattern, inlineTag, minify, parser) {
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
					codes = parser(base, filename, fs.readFileSync(filename).toString(), minify);
					gutil.log('Inline:', gutil.colors.green(relative));
				} else {
					codes = '';
					gutil.log('Missing:', gutil.colors.red(relative));
				}
				return '';
			});
		});
		if (codes !== undefined) {
			var openTag = '<' + inlineTag + attrCodes + '>';
			var closeTag = '</' + inlineTag + '>';
			tag = openTag + codes + closeTag;
		}
		return tag;
	});
	return html;
}

function jsParser(base, filename, source, minify) {
	if (minify) {
		return UglifyJS.minify(source, {fromString: true}).code;
	} else {
		return source;
	}
}

function cssParser(base, filename, source, minify) {
	var dirname = path.dirname(filename);
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

function fileInline(opts) {
	opts = opts || {};

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			return cb();
		} else if (file.isStream()) {
			cb(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
		} else if (file.isBuffer()) {
			var html = file.contents.toString();
			var base = file.base;
			var types = Object.keys(defOpts);
			for (var i = 0, l = types.length; i < l; ++i) {
				var type = types[i];
				if (opts[type] === null) {
					continue;
				}
				var opt = opts[type] || {};
				var defOpt = defOpts[type];
				html = inline(
					html, base,
					opt.filter,
					opt.tagPattern || defOpt.tagPattern,
					opt.urlPattern || defOpt.urlPattern,
					opt.inlineTag || defOpt.inlineTag,
					opt.minify || defOpt.minify,
					opt.parser || defOpt.parser
				);
			}
			file.contents = new Buffer(html);
			cb(null, file);
		}
	});
}

exports = module.exports = fileInline;

exports.cssParser = cssParser;
exports.jsParser = jsParser;
