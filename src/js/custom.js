(function ($) {
    'use strict';
    $(document).ready(function () {
        // 刷新页面数据显示
        if(sessionStorage.getItem('authorityInfo')){
            $('#btn-login').prop('disabled', true);
            $("#login-text").html(JSON.parse(sessionStorage.getItem('authorityInfo')).account);
        }
        // -----------------------------
        //  login
        // -----------------------------
        $('#form').bootstrapValidator({
            fields: {
                account: {
                    validators: {
                        notEmpty: {
                            message: '账号不能为空'
                        }
                    }
                },
                password: {
                    validators: {
                        notEmpty: {
                            message: '密码不能为空'
                        }
                    }
                }
            }
        });
        $("#btn-submit").click(function () {
            $('form').bootstrapValidator('validate');
            if ($("#form").data('bootstrapValidator').isValid()) {
                var url = '/api/user/staff/login';
                var data = {
                    account: $(":input[name='account']").eq(0).val(),
                    password: md5($(":input[name='password']").eq(0).val())
                }
                NProgress.start();
                $.ajax({
                    url: url,
                    type: 'POST',
                    contentType: "application/json;charset=UTF-8",
                    data: JSON.stringify(data),
                    success: function (resp) {
                        if (!resp.success) {
                            toastr.info(resp.errorDesc);
                        } else {
                            toastr.success('登录成功');
                            var loginInfo = resp;
                            var tokenInfo = _.extend(_.pick(loginInfo.data, 'account', 'name'), _.pick(loginInfo.data, 'authority', 'api3rdId'));
                            sessionStorage.setItem('authorityInfo', JSON.stringify(tokenInfo));
                            $('#exampleModalCenter').modal('hide');
                            $('#btn-login').prop('disabled', true);
                            $("#login-text").html(tokenInfo.account);
                        }
                        NProgress.done();
                    },
                    error: function (err) {
                        console.log(err)
                    }

                });
            }
        });
        // -----------------------------
        //  select
        // -----------------------------
        $('#inputHpzl').on('change', function () {
            if (sessionStorage.getItem('authorityInfo')) {
                var selectValue = $(this).find('option:selected').attr('value');
                if (selectValue !== undefined) {
                    $('#inputHphm').animate({ width: '220px', opacity: 1 }).focus();
                } else {
                    $('#inputHphm').animate({ width: 0, opacity: 0 });
                }
            }else{
                $("#inputHpzl option:first").prop("selected", 'selected')
                $('#exampleModalCenter').modal('show')
            }
        })
        $('#inputHphm').keydown(function (e) {
            if (e.keyCode == 13) {
                var pattern = /^[\u4e00-\u9fa5]{1}[a-zA-Z]{1}[a-zA-Z_0-9]{4}[a-zA-Z_0-9\u4e00-\u9fa5]$/;
                var val = $('#inputHphm').val();
                if (pattern.test(val)) {
                    if (sessionStorage.getItem('authorityInfo')) {
                        var url = '/api/traffic/license/detail';
                        // var url = '/api/police/identity'; // test remove
                        var params = _.defaults({}, {
                            account: _.propertyOf(JSON.parse(sessionStorage.getItem('authorityInfo')))('account'),
                            hpzl: $('#inputHpzl').find('option:selected').attr('value'),
                            hphm: val
                        });
                        NProgress.start();
                        $.ajax({
                            url: url,
                            type: 'GET',
                            data: params,
                            success: function (resp) {
                                if (!resp.success) {
                                    toastr.info(resp.errorDesc);
                                } else {
                                    var data = {
                                        "xh": "32030013153723",   //序号
                                        "hpzl": "02",               //号牌种类
                                        "hphm": "CQ9**K",       //号牌号码
                                        "clpp1": "长安牌",        //中文品牌
                                        "clxh": "SC7164A",         //车辆型号
                                        "clsbdh": "LS5A3DBE8DA205297",    //车辆识别代号
                                        "fdjh": "DC9J037260",     //发动机号
                                        "cllx": "K33",            //车辆类型
                                        "csys": "A",               //车身颜色
                                        "syxz": "A",                //使用性质
                                        "syr": "陈*海",                //机动车所有人
                                        "ccdjrq": "2013-08-26 11:13:48",    //初次登记日期
                                        "yxqz": "2017-08-31 00:00:00",         //检验有效期止
                                        "qzbfqz": "2099-12-31 00:00:00",       //强制报废期止
                                        "zt": "A",                            //机动车状态
                                        "fdjxh": "JL478QEE",                   //发动机型号
                                        "rlzl": "A",                            //燃料种类
                                        "pl": "1598",                         //排量
                                        "gl": "92",                   //功率
                                        "zs": "2",                     //轴数
                                        "zj": "2560",               //轴距
                                        "qlj": "1560",            //前轮距
                                        "hlj": "1560",           //后轮距
                                        "zzl": "1645",       //总质量
                                        "zbzl": "1270",     //整备质量
                                        "hdzzl": "",     //核定载质量
                                        "hdzk": "5",             //核定载客
                                        "ccrq": "2013-08-16 00:00:00"    //出厂日期
                                    };
                                    data = resp.data;
                                    console.log(resp.data);
                                    $.each(data, function (key, value) {
                                        $('[data-pro="' + key + '"]').html(value)
                                    });
                                    $('#result-data').removeClass('d-none');
                                    $("html,body").animate({ "scrollTop": window.innerHeight }, 800);
                                }
                                NProgress.done();
                            },
                            error: function (err) {
                                console.log(err)
                            }

                        });
                    } else {
                        $('#exampleModalCenter').modal('show')
                    }
                }else{
                    toastr.info('车牌号不合法');
                }
            }
        })
    });

})(jQuery);