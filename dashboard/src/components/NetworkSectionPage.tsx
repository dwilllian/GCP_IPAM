import { Card, CardContent, Stack, Typography } from "@mui/material";
import { useMemo } from "react";

import type { PageContent } from "../types";
import { NetworkFeatureCard } from "./NetworkFeatureCard";

type NetworkSectionPageProps = {
  content: PageContent;
};

export function NetworkSectionPage({ content }: NetworkSectionPageProps) {
  const highlights = useMemo(() => content.highlights, [content.highlights]);

  return (
    <Stack spacing={3}>
      <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e0e0e0" }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {content.title}
            </Typography>
            <Typography color="text.secondary">{content.description}</Typography>
            <Stack spacing={1}>
              {highlights.map((highlight) => (
                <Typography key={highlight} variant="body2" color="text.secondary">
                  • {highlight}
                </Typography>
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
      <Stack spacing={2}>
        {content.features.map((feature) => (
          <NetworkFeatureCard key={feature.id} feature={feature} />
        ))}
      </Stack>
    </Stack>
  );
}
