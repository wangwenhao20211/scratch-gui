import {IntlProvider as ReactIntlProvider} from 'react-intl';
import {connect} from 'react-redux';
import customTranslations from './custom-translations.js';

const mapStateToProps = state => {
    const locale = state.locales.locale;
    const messages = state.locales.messages;
    const custom = customTranslations[locale];

    return {
        key: locale,
        locale,
        // 自定义翻译优先级更高，覆盖官方翻译
        messages: custom ? {...messages, ...custom} : messages
    };
};

export default connect(mapStateToProps)(ReactIntlProvider);