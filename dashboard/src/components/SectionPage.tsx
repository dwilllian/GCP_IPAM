import { Card, CardContent, Typography } from "@mui/material";

type SectionPageProps = {
  title: string;
  description: string;
};

export function SectionPage({ title, description }: SectionPageProps) {
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
