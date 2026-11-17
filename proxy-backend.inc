# Reenvío al backend, compartido por las rutas /api/ de nginx.conf (no es un archivo .conf: nginx no lo carga solo).
resolver 127.0.0.11 valid=10s ipv6=off;   # DNS interno de Docker
set $backend http://backend:8080;
proxy_pass $backend;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
