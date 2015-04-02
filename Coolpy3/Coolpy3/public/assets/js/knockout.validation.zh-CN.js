/// <reference path="../Src/knockout.validation.js" />

/************************************************
* This is an example localization page. All of these
* messages are the default messages for ko.validation
* 
* Currently ko.validation only does a single parameter replacement
* on your message (indicated by the {0}).
*
* The parameter that you provide in your validation extender
* is what is passed to your message to do the {0} replacement.
*
* eg: myProperty.extend({ minLength: 5 });
* ... will provide a message of "Please enter at least 5 characters"
* when validated
*
* This message replacement obviously only works with primitives
* such as numbers and strings. We do not stringify complex objects 
* or anything like that currently.
*/

ko.validation.localize({
    required: '该值为必填项.',
    min: '必须大于或等于{0}.',
    max: '必须小于或等于{0}.',
    minLength: '最少要输入{0}个字.',
    maxLength: '最多可以输入{0}个字.',
    pattern: '此项数值不合法.',
    step: '该值必须增加{0}',
    email: '必须是电子邮箱地址',
    date: '必须是日期，如2014/11/25',
    dateISO: '必须是ISO日期，如2014-11-25T12:30:55',
    number: '必须是数值型',
    digit: '必须是整数型',
    phoneUS: 'Please specify a valid phone number',
    equal: '必须与某值相等',
    notEqual: '必须与某值不相等',
    unique: '请确保该值是唯一的'
});