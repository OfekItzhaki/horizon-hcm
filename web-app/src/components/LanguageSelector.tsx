import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import CheckIcon from '@mui/icons-material/Check';
import { useState } from 'react';
import { useTranslation } from '../i18n/i18nContext';

export function LanguageSelector() {
  const { locale, setLocale } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (newLocale: 'en' | 'he') => {
    setLocale(newLocale);
    handleClose();
  };

  return (
    <>
      <IconButton onClick={handleOpen} color="inherit">
        <LanguageIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleLanguageChange('en')}>
          {locale === 'en' && (
            <ListItemIcon>
              <CheckIcon fontSize="small" />
            </ListItemIcon>
          )}
          <ListItemText inset={locale !== 'en'}>English</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('he')}>
          {locale === 'he' && (
            <ListItemIcon>
              <CheckIcon fontSize="small" />
            </ListItemIcon>
          )}
          <ListItemText inset={locale !== 'he'}>עברית</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
