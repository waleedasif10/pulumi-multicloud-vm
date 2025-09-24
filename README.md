# Pulumi Multi-Cloud VM Deployment

This project demonstrates a **reusable Pulumi module**, published on **npm** as `pulumi-multicloud-vm`, that provisions virtual machines on **AWS** (EC2) and **Azure** (Virtual Machine) using TypeScript. It also includes a client project that consumes the module to deploy VMs with minimal code.

---

## Project Overview

### Goals

* Provision **1 AWS EC2 instance** + **1 Azure VM** with a reusable Pulumi component.
* Accept configurable inputs (instance size, region, OS image).
* Allow multi-cloud deployments from a single module.
* Demonstrate module consumption in a separate client project.

### Key Features

* Self-contained Pulumi component for multi-cloud VM deployment.
* Supports input variables for both AWS and Azure VM specifications.
* Clean separation between module and client project.
* Designed for reusability and can be imported directly from **npm**.

---

## Project Structure

```
.
├── Pulumi.yaml              # Pulumi project configuration
├── index.ts                 # Entry point for deploying via client project
├── package.json             # Node.js dependencies and metadata
├── tsconfig.json            # TypeScript compiler configuration
└── src/                     # Source code for the reusable module
    ├── multicloud.ts        # MultiCloudVM component resource
    └── types.ts             # Config and output type definitions
```

---

## Installing the Module

The module is published on **npm**:

```bash
npm install pulumi-multicloud-vm
```

You can now import and use it in any Pulumi project:

```ts
import { MultiCloudVM, Config } from "pulumi-multicloud-vm";

const cfg: Config = {
    name: "demo-multicloud",
    aws: {
        region: "us-east-1",
        instanceType: "t3.micro",
        ami: "ami-08c40ec9ead489470",
        allowssh: true,
        allowhttp: true,
    },
    azure: {
        location: "eastus",
        vmSize: "Standard_B1s",
        adminUsername: "testadmin",
        adminPassword: "Password1234!",
        allowssh: true,
        allowhttp: true,
        imagePublisher: "Canonical",
        imageOffer: "UbuntuServer",
        imageSku: "18.04-LTS",
        imageVersion: "latest",
    },
};

const multiCloud = new MultiCloudVM("demo-vm", cfg);

export const outputs = multiCloud.outputs;
```

---

## Usage

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Pulumi

Set AWS and Azure credentials before running deployments:

```bash
# Azure
az login
pulumi config set azure-native:location eastus

# AWS
export AWS_ACCESS_KEY_ID=<your-access-key>
export AWS_SECRET_ACCESS_KEY=<your-secret-key>
pulumi config set aws:region us-east-1
```

### 3. Deploy the Multi-Cloud VM

```bash
pulumi up
```

---

## Configuration Options

### AWS VM

* `region`: AWS region
* `instanceType`: EC2 instance type (e.g., `t3.micro`)
* `ami`: Amazon Machine Image ID
* `allowssh`: Open port 22
* `allowhttp`: Open port 80

### Azure VM

* `location`: Azure region
* `vmSize`: VM size (e.g., `Standard_B1s`)
* `adminUsername` / `adminPassword`: VM login credentials
* `allowssh`: Open port 22
* `allowhttp`: Open port 80
* `imagePublisher`, `imageOffer`, `imageSku`, `imageVersion`: OS image details

---

## Outputs

After deployment, Pulumi exports:

```json
{
  "aws": {
    "instanceId": "<EC2-instance-id>",
    "publicIp": "<EC2-public-ip>"
  },
  "azure": {
    "vmId": "<Azure-VM-resource-id>",
    "publicIp": "<Azure-VM-public-ip>"
  }
}
```

Retrieve via:

```bash
pulumi stack output
```

---

## Notes

* This module is reusable; you can import it into other projects using `npm install pulumi-multicloud-vm`.
* All multi-cloud logic is contained in `src/multicloud.ts`.
* Sensitive credentials (like passwords or AWS secrets) should be stored securely (Pulumi secrets or environment variables).

---

## References

* [Pulumi Docs](https://www.pulumi.com/docs/)
* [AWS Provider](https://www.pulumi.com/docs/intro/cloud-providers/aws/)
* [Azure Native Provider](https://www.pulumi.com/docs/intro/cloud-providers/azure-native/)
* [TypeScript Support](https://www.pulumi.com/docs/get-started/lang-typescript/)


