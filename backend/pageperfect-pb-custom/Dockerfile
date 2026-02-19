# Build stage (PocketBase v0.36 requires Go 1.24+)
FROM golang:1.24-alpine AS builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -o /pageperfect-pb-custom .

# Run stage
FROM alpine:latest
WORKDIR /app
COPY --from=builder /pageperfect-pb-custom .
ENTRYPOINT ["./pageperfect-pb-custom"]
CMD ["serve"]

