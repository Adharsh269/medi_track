# Test the MediTrack API locally

Start the server from the `backend` folder with `npm run dev`.
Leave it running, then open a second terminal and run:

```bash
curl -i http://127.0.0.1:5001/health
curl -i http://127.0.0.1:5001/api/organizations
```

Both requests should return `200 OK`. The health response confirms the
database connection. The organizations response contains a `data` array;
an empty array is valid when no organizations have been added.

To run the same check in Swagger, open http://127.0.0.1:5001/api-docs/,
expand `GET /api/organizations`, and select **Try it out → Execute**.
