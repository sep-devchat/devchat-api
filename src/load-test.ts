import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
	vus: 50, // 🔹 50 concurrent virtual users
	duration: "1m", // 🔹 keep them running for 1 minute
	thresholds: {
		http_req_duration: ["p(95)<1000"], // 95% of requests < 1s (tune this)
		http_req_failed: ["rate<0.01"], // <1% failed requests
	},
};

const BASE_URL = "http://localhost:3000";
const AUTH_TOKEN =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzY2NzMwNzY5LCJleHAiOjE3NzUzNzA3NjksImlzcyI6ImxvY2FsaG9zdDozMDAwIiwic3ViIjoiNjdiMGEyNDEtNzk5Zi00OWI0LThiOWEtOWExZjUxOTdjZjQzIn0.jUcX_W8ZH5jyAICQkceJrjmVfYlnBb7sAQxoAp3WD58";
const CODE_BLOCK_ID = "d9f8713d-d3a7-493a-b3bb-41bbc0f99443";

export default function () {
	const url = `${BASE_URL}/api/code/code-block`;

	const payload = JSON.stringify({
		codeBlockId: CODE_BLOCK_ID, // your body
	});

	const headers = {
		"Content-Type": "application/json",
	};

	// If you have a Bearer token, attach it
	if (AUTH_TOKEN) {
		headers["Authorization"] = `Bearer ${AUTH_TOKEN}`;
	}

	const res = http.post(url, payload, { headers });

	check(res, {
		"status is 2xx": (r) => r.status >= 200 && r.status < 300,
	});

	// Think time between calls so each user behaves like a real client
	sleep(1);
}
