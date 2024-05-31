# JobApplicationService_GCloudRun
1. [Download](https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe?hl=it) and install Google Cloud SDK
2. Run `gcloud init` to initialize the SDK
3. Run `gcloud auth login` to authenticate with Google Cloud
4. Run `gcloud config set project <PROJECT_ID>` to set the default project. PROJECT_ID should be `efebia-website`
5. Run `gcloud auth configure-docker europe-west3-docker.pkg.dev` to configure Docker to use the Google Cloud Container Registry
6. Setup the environment variables in the env file
7. Run `yarn gcrun:all` to build the Docker image and deploy the service to Google Cloud Run