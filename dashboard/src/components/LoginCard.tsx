import { Button, Card, CardContent, Container, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";

type LoginFormState = {
  email: string;
  password: string;
};

const initialLoginForm: LoginFormState = {
  email: "",
  password: "",
};

type LoginCardProps = {
  onLogin: (payload: LoginFormState) => void;
  error: string | null;
  loading: boolean;
};

export function LoginCard({ onLogin, error, loading }: LoginCardProps) {
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

export type { LoginFormState };
