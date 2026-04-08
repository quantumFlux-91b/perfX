{{/*
Expand the name of the chart.
*/}}
{{- define "perfx.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this.
*/}}
{{- define "perfx.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Chart label.
*/}}
{{- define "perfx.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels applied to every resource.
*/}}
{{- define "perfx.labels" -}}
helm.sh/chart: {{ include "perfx.chart" . }}
app.kubernetes.io/name: {{ include "perfx.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
{{- end }}

{{/*
Selector labels for the backend.
*/}}
{{- define "perfx.backend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "perfx.name" . }}-backend
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Selector labels for the frontend.
*/}}
{{- define "perfx.frontend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "perfx.name" . }}-frontend
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Selector labels for PostgreSQL.
*/}}
{{- define "perfx.postgres.selectorLabels" -}}
app.kubernetes.io/name: {{ include "perfx.name" . }}-postgres
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Resolve the PostgreSQL hostname:
  - Bundled postgres → service name in this release
  - Bitnami sub-chart → bitnami convention
  - External         → externalDatabase.host
*/}}
{{- define "perfx.databaseHost" -}}
{{- if .Values.postgres.enabled }}
{{- printf "%s-postgres" (include "perfx.fullname" .) }}
{{- else if .Values.postgresql.enabled }}
{{- printf "%s-postgresql" .Release.Name }}
{{- else }}
{{- .Values.externalDatabase.host | required "externalDatabase.host is required when postgres.enabled=false and postgresql.enabled=false" }}
{{- end }}
{{- end }}

{{/*
Resolve the PostgreSQL database name.
*/}}
{{- define "perfx.databaseName" -}}
{{- if .Values.postgres.enabled }}
{{- .Values.postgres.auth.database }}
{{- else if .Values.postgresql.enabled }}
{{- .Values.postgresql.auth.database }}
{{- else }}
{{- .Values.externalDatabase.database }}
{{- end }}
{{- end }}

{{/*
Resolve the PostgreSQL username.
*/}}
{{- define "perfx.databaseUser" -}}
{{- if .Values.postgres.enabled }}
{{- .Values.postgres.auth.username }}
{{- else if .Values.postgresql.enabled }}
{{- .Values.postgresql.auth.username }}
{{- else }}
{{- .Values.externalDatabase.username }}
{{- end }}
{{- end }}

{{/*
Name of the Secret that holds POSTGRES_PASSWORD.
*/}}
{{- define "perfx.databaseSecretName" -}}
{{- if .Values.postgres.auth.existingSecret }}
{{- .Values.postgres.auth.existingSecret }}
{{- else }}
{{- printf "%s-postgres-secret" (include "perfx.fullname" .) }}
{{- end }}
{{- end }}

{{/*
Key inside the Secret for the password.
*/}}
{{- define "perfx.databaseSecretKey" -}}
{{- if .Values.postgres.auth.existingSecretKey }}
{{- .Values.postgres.auth.existingSecretKey }}
{{- else }}
POSTGRES_PASSWORD
{{- end }}
{{- end }}

{{/*
Image pull secrets block.
*/}}
{{- define "perfx.imagePullSecrets" -}}
{{- with .Values.global.imagePullSecrets }}
imagePullSecrets:
  {{- toYaml . | nindent 2 }}
{{- end }}
{{- end }}
