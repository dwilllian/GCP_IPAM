import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  CssBaseline,
  Grid,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useEffect, useState } from "react";

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
    fontFamily: "\"Roboto\", \"Helvetica\", \"Arial\", sans-serif",
  },
});

export default function App() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllocations = async () => {
    setLoading(true);
    const response = await fetch("/api/allocations");
    const data = (await response.json()) as Allocation[];
    setAllocations(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllocations();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            IPAM Dashboard
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button color="inherit" variant="outlined" onClick={fetchAllocations}>
            Atualizar
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e0e0e0" }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                Visão geral
              </Typography>
              <Typography color="text.secondary">
                Monitoramento interno de VPCs, subnets e blocos IP alocados.
              </Typography>
            </CardContent>
          </Card>

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
                ))}
                {!loading && allocations.length === 0 && (
                  <Grid item xs={12}>
                    <Typography color="text.secondary">
                      Nenhuma alocação ainda. Cadastre via API para preencher o
                      dashboard.
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </ThemeProvider>
  );
}
