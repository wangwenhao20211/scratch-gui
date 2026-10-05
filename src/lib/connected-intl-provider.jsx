// src/lib/connected-intl-provider.jsx
import {IntlProvider as ReactIntlProvider} from 'react-intl';
import {connect} from 'react-redux';
import customTranslations from './custom-translations.js';

const mapStateToProps = state => {
    const locale = state.locales.locale;
    const messages = state.locales.messages;
    
    // 尝试获取当前 locale 的自定义翻译
    let custom = customTranslations[locale];

    // 如果没找到（比如 zh-cn 没找到），尝试找语言主代码（zh）
    if (!custom && locale.includes('-')) {
        const lang = locale.split('-')[0];
        custom = customTranslations[lang];
    }

    // 合并：官方 messages 在前，自定义翻译在后，实现覆盖
    const mergedMessages = custom ? {...messages, ...custom} : messages;

    return {
        // key 绑定到 locale，确保语言切换时强制重新渲染
        key: locale, 
        locale,
        messages: mergedMessages
    };
};

export default connect(mapStateToProps)(ReactIntlProvider);