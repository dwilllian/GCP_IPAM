import {
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

import { navSections } from "../data/navSections";

type NavigationSidebarProps = {
  onLogout: () => void;
  open: boolean;
  drawerWidth: number;
  drawerCollapsedWidth: number;
};

export function NavigationSidebar({
  onLogout,
  open,
  drawerWidth,
  drawerCollapsedWidth,
}: NavigationSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : drawerCollapsedWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: open ? drawerWidth : drawerCollapsedWidth,
          boxSizing: "border-box",
          backgroundColor: "#f5f7fb",
          borderRight: "1px solid #e0e0e0",
          transition: "width 0.2s ease",
          overflowX: "hidden",
        },
      }}
    >
      <Toolbar>
        {open && (
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            IPAM Dashboard
          </Typography>
        )}
      </Toolbar>
      <Divider />
      {navSections.map((section) => (
        <List
          key={section.title}
          subheader={open ? <Typography sx={{ px: 2, pt: 2 }}>{section.title}</Typography> : undefined}
        >
          {section.items.map((item) => (
            <Tooltip
              key={item.path}
              title={open ? "" : `${item.label} — ${item.description}`}
              placement="right"
            >
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{ borderRadius: 2, mx: 1, gap: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 0, color: "inherit" }}>
                  {item.icon}
                </ListItemIcon>
                {open && <ListItemText primary={item.label} secondary={item.description} />}
              </ListItemButton>
            </Tooltip>
          ))}
        </List>
      ))}
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ p: 2 }}>
        <Button variant="outlined" fullWidth onClick={onLogout}>
          {open ? "Sair" : ""}
        </Button>
      </Box>
    </Drawer>
  );
}
