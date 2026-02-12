import React, { useState } from 'react';
import { 
    AppBar, 
    Toolbar, 
    Typography, 
    Button, 
    Menu, 
    MenuItem, 
    Box, 
    Container,
    IconButton
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import { useNavigate, Link } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    
    // State for Login Dropdown
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleLoginClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNavigate = (path) => {
        navigate(path);
        handleClose();
    };

    return (
        <AppBar 
            position="sticky" 
            elevation={0} 
            sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid #e0e0e0',
                color: '#0f172a' 
            }}
        >
            <Container maxWidth="xl">
                <Toolbar sx={{ justifyContent: 'space-between', height: '70px' }}>
                    
                    {/* Logo Section */}
                    <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
                        <TravelExploreIcon sx={{ color: '#4A90E2', fontSize: '30px', mr: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                            STP <span style={{ color: '#4A90E2' }}>AI</span>
                        </Typography>
                    </Box>

                    {/* Navigation Links */}
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3 }}>
                        <Button component={Link} to="/" sx={{ color: '#475569', fontWeight: 600, textTransform: 'none' }}>Home</Button>
                        <Button component={Link} to="/about" sx={{ color: '#475569', fontWeight: 600, textTransform: 'none' }}>About</Button>
                        <Button component={Link} to="/contact" sx={{ color: '#475569', fontWeight: 600, textTransform: 'none' }}>Contact</Button>
                    </Box>

                    {/* Login Action Area */}
                    <Box>
                        <Button
                            id="login-button"
                            aria-controls={open ? 'login-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={open ? 'true' : undefined}
                            variant="contained"
                            disableElevation
                            onClick={handleLoginClick}
                            endIcon={<KeyboardArrowDownIcon />}
                            sx={{
                                backgroundColor: '#4A90E2',
                                textTransform: 'none',
                                borderRadius: '8px',
                                fontWeight: 600,
                                px: 3,
                                '&:hover': { backgroundColor: '#357ABD' }
                            }}
                        >
                            Login
                        </Button>
                        
                        {/* Classy Dropdown Menu */}
                        <Menu
                            id="login-menu"
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleClose}
                            MenuListProps={{ 'aria-labelledby': 'login-button' }}
                            PaperProps={{
                                elevation: 4,
                                sx: {
                                    mt: 1,
                                    minWidth: 180,
                                    borderRadius: '12px',
                                    border: '1px solid #f1f5f9',
                                    '& .MuiMenuItem-root': {
                                        fontSize: '0.95rem',
                                        fontWeight: 500,
                                        py: 1.5,
                                        '&:hover': { backgroundColor: '#f0f7ff', color: '#4A90E2' }
                                    }
                                }
                            }}
                        >
                            <MenuItem onClick={() => handleNavigate('/user-login')}>
                                Traveler Login
                            </MenuItem>
                            <MenuItem onClick={() => handleNavigate('/admin-login')}>
                                Admin Portal
                            </MenuItem>
                        </Menu>
                    </Box>

                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default Navbar;