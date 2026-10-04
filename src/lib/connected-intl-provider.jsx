import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import {IntlProvider as ReactIntlProvider} from 'react-intl';
import {connect} from 'react-redux';

const CustomIntlProvider = props => {
    const {locale, messages, ...rest} = props;
    const [customMessages, setCustomMessages] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setCustomMessages(null);

        // 尝试从 static/custom-translations/{locale}.json 加载你自己的翻译
        fetch(`${process.env.ROOT}custom-translations/${locale}.json`)
            .then(res => {
                if (!res.ok) return null;
                return res.json();
            })
            .then(data => {
                if (!cancelled && data) setCustomMessages(data);
            })
            .catch(() => {
                // 没有自定义翻译文件时静默忽略
            });

        return () => {
            cancelled = true;
        };
    }, [locale]);

    // 自定义翻译会覆盖官方翻译（后面的对象优先）
    const mergedMessages = customMessages ?
        {...messages, ...customMessages} :
        messages;

    return (
        <ReactIntlProvider
            {...rest}
            locale={locale}
            messages={mergedMessages}
        />
    );
};

CustomIntlProvider.propTypes = {
    locale: PropTypes.string,
    messages: PropTypes.object
};

const mapStateToProps = state => ({
    key: state.locales.locale,
    locale: state.locales.locale,
    messages: state.locales.messages
});

export default connect(mapStateToProps)(CustomIntlProvider);