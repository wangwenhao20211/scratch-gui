import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';

import LanguageMenu from './language-menu.jsx';
import MenuBarMenu from './menu-bar-menu.jsx';
import {MenuSection, MenuItem, Submenu} from '../menu/menu.jsx';
import MenuLabel from './tw-menu-label.jsx';
import TWAccentThemeMenu from './tw-theme-accent.jsx';
import TWGuiThemeMenu from './tw-theme-gui.jsx';
import TWBlocksThemeMenu from './tw-theme-blocks.jsx';
import TWDesktopSettings from './tw-desktop-settings.jsx';

import menuBarStyles from './menu-bar.css';
import styles from './settings-menu.css';

import dropdownCaret from './dropdown-caret.svg';
import settingsIcon from './icon--settings.svg';

const WwhPanelsMenu = ({onOpenSecurity, onOpenNetwork}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
        <MenuItem expanded={isOpen}>
            <div
                className={styles.option}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={styles.submenuLabel}>
                    <FormattedMessage
                        defaultMessage="安全见解"
                        description="Security panel submenu label"
                        id="wwh.menuBar.security"
                    />
                </span>
                <img
                    className={styles.expandCaret}
                    src={dropdownCaret}
                    draggable={false}
                />
            </div>
            <Submenu place="right">
                <MenuItem onClick={onOpenSecurity}>
                    <FormattedMessage
                        defaultMessage="扩展安全设置"
                        description="Open extension security panel"
                        id="wwh.menuBar.securityPanel"
                    />
                </MenuItem>
                <MenuItem onClick={onOpenNetwork}>
                    <FormattedMessage
                        defaultMessage="网络请求管理"
                        description="Open network request panel"
                        id="wwh.menuBar.networkPanel"
                    />
                </MenuItem>
            </Submenu>
        </MenuItem>
    );
};

WwhPanelsMenu.propTypes = {
    onOpenSecurity: PropTypes.func,
    onOpenNetwork: PropTypes.func
};

const SettingsMenu = ({
    canChangeLanguage,
    canChangeTheme,
    isRtl,
    onClickDesktopSettings,
    onClickWwhSecurityPanel,
    onClickWwhNetworkPanel,
    onOpenCustomSettings,
    onRequestClose,
    onRequestOpen,
    settingsMenuOpen
}) => (
    <MenuLabel
        open={settingsMenuOpen}
        onOpen={onRequestOpen}
        onClose={onRequestClose}
    >
        <img
            src={settingsIcon}
            draggable={false}
            width={20}
            height={20}
        />
        <span className={styles.dropdownLabel}>
            <FormattedMessage
                defaultMessage="Settings"
                description="Settings menu"
                id="gui.menuBar.settings"
            />
        </span>
        <img
            src={dropdownCaret}
            draggable={false}
            width={8}
            height={5}
        />
        <MenuBarMenu
            className={menuBarStyles.menuBarMenu}
            open={settingsMenuOpen}
            place={isRtl ? 'left' : 'right'}
        >
            <MenuSection>
                {canChangeLanguage && <LanguageMenu onRequestCloseSettings={onRequestClose} />}
                {canChangeTheme && (
                    <React.Fragment>
                        <TWGuiThemeMenu />
                        <TWBlocksThemeMenu
                            onOpenCustomSettings={onOpenCustomSettings}
                        />
                        <TWAccentThemeMenu />
                    </React.Fragment>
                )}
                <WwhPanelsMenu
                    onOpenSecurity={onClickWwhSecurityPanel}
                    onOpenNetwork={onClickWwhNetworkPanel}
                />
                {onClickDesktopSettings && <TWDesktopSettings onClick={onClickDesktopSettings} />}
            </MenuSection>
        </MenuBarMenu>
    </MenuLabel>
);

SettingsMenu.propTypes = {
    canChangeLanguage: PropTypes.bool,
    canChangeTheme: PropTypes.bool,
    isRtl: PropTypes.bool,
    onClickDesktopSettings: PropTypes.func,
    onOpenCustomSettings: PropTypes.func,
    onRequestClose: PropTypes.func,
    onRequestOpen: PropTypes.func,
    settingsMenuOpen: PropTypes.bool,
    onClickWwhSecurityPanel: PropTypes.func,
    onClickWwhNetworkPanel: PropTypes.func
};

export default SettingsMenu;