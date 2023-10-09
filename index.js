import { OpenAI } from "openai";
import fs from "fs";

const openai = new OpenAI({
  apiKey: "api-key",
});

async function main(fileId) {
  let file;

  if (!fileId) {
    // Upload the file
    try {
      console.log("Uploading file...");
      const response = await openai.files.create({
        file: fs.createReadStream("./data.jsonl"),
        purpose: "fine-tune",
      });

      file = response;
      console.log(`File uploaded successfully. File ID: ${file.id}`);
    } catch (error) {
      console.error(`File upload failed: ${error}`);
      return;
    }
  } else {
    file = { id: fileId };
    console.log(`Using provided file ID: ${file.id}`);
  }

  // Create the fine-tuning job
  let job;
  try {
    console.log("Creating fine-tuning job...");
    job = await openai.fineTuning.jobs.create({
      training_file: file.id, // Use the file ID from the response
      model: "gpt-3.5-turbo",
      hyperparameters: { n_epochs: 3 }, // adjust as needed or comment out for auto
    });
    console.log(`Fine-tuning job created successfully. Job ID: ${job.id}`);
  } catch (error) {
    console.error(`Fine-tuning job creation failed: ${error}`);
    return;
  }

  // Check the status of the fine-tuning job
  try {
    console.log("Checking fine-tuning job status...");
    let status = await openai.fineTuning.jobs.retrieve(job.id);
    while (status.status !== "succeeded") {
      if (status.status === "failed") {
        console.error(`Fine-tuning job failed. Reason: ${status.error}`);
        return;
      }
      console.log(`Current status: ${status.status}`);
      await new Promise((resolve) => setTimeout(resolve, 60000)); // Wait for 60 seconds
      status = await openai.fineTuning.jobs.retrieve(job.id);
    }

    console.log(
      `Fine-tuning job finished successfully. Final status: ${status.status}`
    );
    console.log(`Model: ${status.model}`);
    console.log(`Fine-tuned model: ${status.fine_tuned_model}`);
    console.log(`Trained tokens: ${status.trained_tokens}`);
    console.log(`Hyperparameters: ${JSON.stringify(status.hyperparameters)}`);
  } catch (error) {
    console.error(`Failed to check fine-tuning job status: ${error}`);
    return;
  }
}

main("file-id-if-applicable");

// Cancel a fine-tuning job
async function cancel(jobId) {
  try {
    await openai.fineTuning.jobs.cancel(jobId);

    const status = await openai.fineTuning.jobs.retrieve(jobId);
    while (status.status !== "cancelled") {
      console.log(`Current status: ${status.status}`);
      await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait for 60 seconds
      status = await openai.fineTuning.jobs.retrieve(jobId);
    }
  } catch (error) {
    console.error(`Failed to cancel fine-tuning job: ${error}`);
    return;
  }
}

cancel("job-id");
