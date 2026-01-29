import { Box, Card, CardContent, Grid, Stack, Typography } from "@mui/material";

import type { Allocation } from "../types";

type AllocationsSectionProps = {
  allocations: Allocation[];
  loading: boolean;
  error: string | null;
};

export function AllocationsSection({ allocations, loading, error }: AllocationsSectionProps) {
  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e0e0e0" }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Alocações registradas
            </Typography>
            <Typography color="text.secondary">
              {loading ? "Carregando..." : `${allocations.length} bloco(s) encontrados`}
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
                    {allocation.network} · {allocation.region}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {allocation.cidr}
                  </Typography>
                  <Typography color="text.secondary">
                    Projeto host: {allocation.host_project_id}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Status: {allocation.status}
                  </Typography>
                  {allocation.owner && (
                    <Typography variant="body2">Responsável: {allocation.owner}</Typography>
                  )}
                  {allocation.purpose && (
                    <Typography variant="body2">Finalidade: {allocation.purpose}</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
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
