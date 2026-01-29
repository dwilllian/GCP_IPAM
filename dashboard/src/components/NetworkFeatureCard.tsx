import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";

import type { FeatureItem } from "../types";

type NetworkFeatureCardProps = {
  feature: FeatureItem;
};

export function NetworkFeatureCard({ feature }: NetworkFeatureCardProps) {
  const [active, setActive] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded((prev) => !prev)}
      sx={{ borderRadius: 2, border: "1px solid #e0e0e0", boxShadow: "none" }}
    >
      <AccordionSummary>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", sm: "center" }}
          sx={{ width: "100%" }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {feature.title}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {feature.description}
            </Typography>
          </Box>
          <Chip color={active ? "success" : "default"} label={active ? "Ativo" : "Inativo"} size="small" />
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <Stack spacing={1}>
            {feature.details.map((detail) => (
              <Typography key={detail} variant="body2" color="text.secondary">
                • {detail}
              </Typography>
            ))}
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant={active ? "outlined" : "contained"}
              color={active ? "inherit" : "primary"}
              onClick={() => setActive((prev) => !prev)}
            >
              {active ? "Desativar recurso" : "Ativar recurso"}
            </Button>
            {feature.actions.map((action) => (
              <Button key={action} variant="text">
                {action}
              </Button>
            ))}
          </Stack>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
