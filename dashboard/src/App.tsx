import { AppBar, Box, Button, CssBaseline, IconButton, Stack, Toolbar, Typography } from "@mui/material";
import { ChevronLeft, Menu } from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AllocationsSection } from "./components/AllocationsSection";
import { LoginCard, type LoginFormState } from "./components/LoginCard";
import { NavigationSidebar } from "./components/NavigationSidebar";
import { NetworkSectionPage } from "./components/NetworkSectionPage";
import { SectionPage } from "./components/SectionPage";
import { navSections } from "./data/navSections";
import { pageContentByPath } from "./data/pageContent";
import type { Allocation } from "./types";

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

type AuthState = {
  token: string;
};

function DashboardApp() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
  const normalizedApiBaseUrl = apiBaseUrl.endsWith("/")
    ? apiBaseUrl.slice(0, -1)
    : apiBaseUrl;
  const [auth, setAuth] = useState<AuthState | null>(() => {
    const token = localStorage.getItem("ipam.token");
    return token ? { token } : null;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchAllocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${normalizedApiBaseUrl}/allocations`, {
        headers: auth?.token
          ? {
              Authorization: `Bearer ${auth.token}`,
            }
          : undefined,
      });
      if (!response.ok) {
        throw new Error("Falha ao carregar alocações.");
      }
      const data = (await response.json()) as Allocation[];
      setAllocations(data);
    } catch (err) {
      setAllocations([]);
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth?.token) {
      fetchAllocations();
    }
  }, [auth?.token]);

  const handleLogin = async (payload: LoginFormState) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(`${normalizedApiBaseUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Credenciais inválidas.");
      }
      const data = (await response.json()) as { token: string };
      localStorage.setItem("ipam.token", data.token);
      setAuth({ token: data.token });
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("ipam.token");
    setAuth(null);
    setAllocations([]);
  };

  if (!auth) {
    return <LoginCard onLogin={handleLogin} error={authError} loading={authLoading} />;
  }

  return (
    <Box sx={{ display: "flex" }}>
      <NavigationSidebar
        onLogout={handleLogout}
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
              <Button color="primary" variant="outlined" onClick={fetchAllocations}>
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
