import { Button } from '@mui/material';

export function SkipToContent() {
  const handleSkip = () => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView();
    }
  };

  return (
    <Button
      onClick={handleSkip}
      sx={{
        position: 'absolute',
        left: '-9999px',
        zIndex: 9999,
        '&:focus': {
          left: '50%',
          top: '10px',
          transform: 'translateX(-50%)',
        },
      }}
    >
      Skip to main content
    </Button>
  );
}
