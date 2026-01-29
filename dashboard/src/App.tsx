import { AppBar, Box, Button, CssBaseline, IconButton, Stack, Toolbar, Typography } from "@mui/material";
import { ChevronLeft, Menu } from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AllocationsSection } from "./components/AllocationsSection";
import { NavigationSidebar } from "./components/NavigationSidebar";
import { NetworkSectionPage } from "./components/NetworkSectionPage";
import { SectionPage } from "./components/SectionPage";
import { navSections } from "./data/navSections";
import { pageContentByPath } from "./data/pageContent";
import type { Allocation } from "./types";
import { fetchAllocations, fetchHealth } from "./api/ipamClient";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1a73e8",
    },
    background: {
      default: "#f8f9fa",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const drawerWidth = 280;
const drawerCollapsedWidth = 84;

function DashboardApp() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [health, setHealth] = useState<string>("Verificando...");

  const loadAllocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllocations();
      setAllocations(data);
    } catch (err: unknown) {
      setAllocations([]);
      if (err && typeof err === "object" && "message" in err) {
        setError(String(err.message));
      } else {
        setError("Erro inesperado.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllocations();
    fetchHealth()
      .then((data) => {
        setHealth(`${data.service} · ${data.version}`);
      })
      .catch(() => {
        setHealth("Indisponível");
      });
  }, []);

  return (
    <Box sx={{ display: "flex" }}>
      <NavigationSidebar
        onLogout={() => setAllocations([])}
        open={sidebarOpen}
        drawerWidth={drawerWidth}
        drawerCollapsedWidth={drawerCollapsedWidth}
      />
      <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
        <Stack spacing={3}>
          <AppBar position="static" color="transparent" elevation={0}>
            <Toolbar disableGutters sx={{ px: 2 }}>
              <IconButton onClick={() => setSidebarOpen((prev) => !prev)}>
                {sidebarOpen ? <ChevronLeft /> : <Menu />}
              </IconButton>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Centro de operações de rede
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Typography color="text.secondary" sx={{ mr: 2 }}>
                API: {health}
              </Typography>
              <Button color="primary" variant="outlined" onClick={loadAllocations}>
                Atualizar dados
              </Button>
            </Toolbar>
          </AppBar>
          <Routes>
            <Route path="/" element={<Navigate to={navSections[0].items[0].path} replace />} />
            {navSections.flatMap((section) =>
              section.items
                .filter((item) => item.path !== "/ips-alocados")
                .map((item) => (
                  <Route
                    key={item.path}
                    path={item.path}
                    element={
                      pageContentByPath[item.path] ? (
                        <NetworkSectionPage content={pageContentByPath[item.path]} />
                      ) : (
                        <SectionPage title={item.label} description={item.description} />
                      )
                    }
                  />
                ))
            )}
            <Route
              path="/ips-alocados"
              element={
                <Stack spacing={3}>
                  <SectionPage
                    title="IPs Alocados"
                    description="Informações detalhadas de blocos, subnets e status de uso."
                  />
                  <AllocationsSection
                    allocations={allocations}
                    loading={loading}
                    error={error}
                  />
                </Stack>
              }
            />
            <Route path="*" element={<Typography>Selecione uma seção no menu.</Typography>} />
          </Routes>
        </Stack>
      </Box>
    </Box>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <DashboardApp />
      </BrowserRouter>
    </ThemeProvider>
  );
}
