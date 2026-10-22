import Card from "@/components/ui/card/card";

export default function ErrorRoute() {
	return (
		<Card style={{ padding: "1rem" }}>
			<h2>Something went wrong</h2>
			<p>Please try refreshing the page.</p>
		</Card>
	);
}
