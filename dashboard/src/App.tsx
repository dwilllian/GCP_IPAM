import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  CssBaseline,
  Divider,
  Drawer,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

interface Allocation {
  id: number;
  cidr: string;
  vpc: string;
  region: string;
  resource_type: string;
  resource_name: string;
  status: string;
  created_by: string;
  created_at: string;
}

interface NavItem {
  label: string;
  path: string;
  description: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

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

const navSections: NavSection[] = [
  {
    title: "Produtos",
    items: [
      {
        label: "Rotas",
        path: "/rotas",
        description: "Mapa de rotas e anúncios configurados.",
      },
      {
        label: "Peering",
        path: "/peering",
        description: "Conexões entre VPCs e projetos.",
      },
      {
        label: "IPs",
        path: "/ips",
        description: "Reservas e ranges em uso.",
      },
      {
        label: "PSA",
        path: "/psa",
        description: "Private Service Access e ranges reservados.",
      },
      {
        label: "Hub",
        path: "/hub",
        description: "Visão de conectividade centralizada.",
      },
      {
        label: "Spokes",
        path: "/spokes",
        description: "Spokes associados ao hub principal.",
      },
      {
        label: "Projetos",
        path: "/projetos",
        description: "Projetos GCP e seus vínculos de rede.",
      },
    ],
  },
  {
    title: "IPAM",
    items: [
      {
        label: "IPs Alocados",
        path: "/ips-alocados",
        description: "Lista de blocos IP alocados por serviço.",
      },
    ],
  },
];

const drawerWidth = 280;

type AuthState = {
  token: string;
};

type LoginFormState = {
  email: string;
  password: string;
};

const initialLoginForm: LoginFormState = {
  email: "",
  password: "",
};

function LoginCard({
  onLogin,
  error,
  loading,
}: {
  onLogin: (payload: LoginFormState) => void;
  error: string | null;
  loading: boolean;
}) {
  const [form, setForm] = useState<LoginFormState>(initialLoginForm);

  return (
    <Container maxWidth="sm" sx={{ py: 10 }}>
      <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e0e0e0" }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Acesso ao IPAM
            </Typography>
            <Typography color="text.secondary">
              Entre com as credenciais cadastradas no banco de dados.
            </Typography>
            <TextField
              label="Email"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              fullWidth
              type="email"
            />
            <TextField
              label="Senha"
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
              fullWidth
              type="password"
            />
            {error && <Typography color="error">{error}</Typography>}
            <Button
              variant="contained"
              onClick={() => onLogin(form)}
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

function SectionPage({ title, description }: { title: string; description: string }) {
  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e0e0e0" }}>
      <CardContent>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          {title}
        </Typography>
        <Typography color="text.secondary">{description}</Typography>
      </CardContent>
    </Card>
  );
}

function AllocationsSection({
  allocations,
  loading,
  error,
}: {
  allocations: Allocation[];
  loading: boolean;
  error: string | null;
}) {
  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e0e0e0" }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Alocações registradas
            </Typography>
            <Typography color="text.secondary">
              {loading
                ? "Carregando..."
                : `${allocations.length} bloco(s) encontrados`}
            </Typography>
          </Box>
        </Stack>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {error && (
            <Grid item xs={12}>
              <Typography color="error">{error}</Typography>
            </Grid>
          )}
          {allocations.map((allocation) => (
            <Grid key={allocation.id} item xs={12} md={6} lg={4}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  borderColor: "#d2e3fc",
                  backgroundColor: "#fff",
                }}
              >
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    {allocation.vpc} · {allocation.region}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {allocation.cidr}
                  </Typography>
                  <Typography color="text.secondary">
                    {allocation.resource_type} — {allocation.resource_name}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Status: {allocation.status}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
          {!loading && allocations.length === 0 && (
            <Grid item xs={12}>
              <Typography color="text.secondary">
                Nenhuma alocação ainda. Cadastre via API para preencher o dashboard.
              </Typography>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}

function NavigationSidebar({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
          backgroundColor: "#f5f7fb",
          borderRight: "1px solid #e0e0e0",
        },
      }}
    >
      <Toolbar>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          IPAM Dashboard
        </Typography>
      </Toolbar>
      <Divider />
      {navSections.map((section) => (
        <List
          key={section.title}
          subheader={<Typography sx={{ px: 2, pt: 2 }}>{section.title}</Typography>}
        >
          {section.items.map((item) => (
            <ListItemButton
              key={item.path}
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{ borderRadius: 2, mx: 1 }}
            >
              <ListItemText primary={item.label} secondary={item.description} />
            </ListItemButton>
          ))}
        </List>
      ))}
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ p: 2 }}>
        <Button variant="outlined" fullWidth onClick={onLogout}>
          Sair
        </Button>
      </Box>
    </Drawer>
  );
}

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
      <NavigationSidebar onLogout={handleLogout} />
      <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
        <Stack spacing={3}>
          <AppBar position="static" color="transparent" elevation={0}>
            <Toolbar disableGutters sx={{ px: 2 }}>
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
                    element={<SectionPage title={item.label} description={item.description} />}
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
