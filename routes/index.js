const express = require('express');
const router = express.Router();
const config = require('../config/admin');
const loginConfig = require('../config/login');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/* GET home page. */
router.get('/', function (req, res, next) {
    if (req.session.loginUser) {  //判断session 状态，如果有效，则返回主页，否则转到登录页面
        res.render('index', config);
    } else {
        res.redirect('login');
    }
    // res.render('index', config);
});

router.get('/module/:mname', function (req, res, next) {
    res.render(req.params.mname);
});

// 获取登录页面
router.get('/login', function (req, res) {
    if (req.session.loginUser) {
        res.redirect('/');
    } else {
        res.render('login');
    }
});

// 用户登录
router.post('/login', function (req, res) {
    const m = crypto.createHash('md5');
    m.update(req.body.pwd, 'utf8');
    const md5pwd = m.digest('hex');
    if (req.body.username == loginConfig.username &&
        md5pwd == loginConfig.password) {
        req.session.loginUser = req.body.username; // 登录成功，设置 session
        res.redirect('/');
    } else {
        res.json({ret_code: 1, ret_msg: '账号或密码错误'});// 若登录失败，重定向到登录页面
    }
});

// 退出
router.get('/logout', function (req, res) {
    req.session.loginUser = null; // 删除session
    res.redirect('login');
});

// 修改密码
router.get('/changepass', function (req, res) {
    if (req.session.loginUser) {
        res.render('changepass')
    } else {
        res.redirect('/');
    }
});

router.post('/changepass', function (req, res) {
    let m = crypto.createHash('md5');
    m.update(req.body.oldpassword, 'utf8');
    let md5pwd = m.digest('hex');
    if (md5pwd != loginConfig.password) {
        res.json({ret_code: 1, ret_msg: '旧密码错误'});
    } else if (req.body.newpwd != req.body.newpwdconfirm){
        res.json({ret_code: 1, ret_msg: '两次密码不一致'});
    } else {
        let m = crypto.createHash('md5');
        m.update(req.body.newpwd, 'utf8');
        md5pwd = m.digest('hex');
        loginConfig.password = md5pwd;
        // console.log(process.cwd());
        fs.writeFileSync(path.join(process.cwd(), 'config/login.json'), JSON.stringify(loginConfig,null, 4));
        res.redirect('/');
    }
});

module.exports = router;
