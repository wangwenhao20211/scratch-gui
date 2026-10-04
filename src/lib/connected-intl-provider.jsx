import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import {IntlProvider as ReactIntlProvider} from 'react-intl';
import {connect} from 'react-redux';

const CustomIntlProvider = props => {
    const {locale, messages, ...rest} = props;
    const [customMessages, setCustomMessages] = useState(null);
    const [loadedLocale, setLoadedLocale] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setCustomMessages(null);
        setLoadedLocale(null);

        // 从 static/custom-translations/{locale}.json 加载你自己的翻译
        fetch(`/custom-translations/${locale}.json`)
            .then(res => {
                if (!res.ok) return null;
                return res.json();
            })
            .then(data => {
                if (!cancelled) {
                    setCustomMessages(data || {});
                    setLoadedLocale(locale);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setCustomMessages({});
                    setLoadedLocale(locale);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [locale]);

    // 加载完成前先用官方 messages 渲染，避免白屏
    const mergedMessages = customMessages ?
        {...messages, ...customMessages} :
        messages;

    // 关键：加载完成后 key 变化，强制重挂载 IntlProvider
    const providerKey = `${locale}-${loadedLocale || 'loading'}`;

    return (
        <ReactIntlProvider
            {...rest}
            key={providerKey}
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