# Summary

The goal of this Proof of Concept is to demonstrate a workflow for Education Supervisors to build custom Programs of Courses for their Machinists (Students). Currently, creating a custom Program path is not possible. We want Education Supervisors to be able to save a library of reusable “Custom Programs” then be able to recommend or force enrollment of students to those Programs.

## Glossary

Program: An assortment of Courses
Course: An assortment of lessons, assessments or resources
Class: A prespecified training event
Self Paced: A Program or course that can be completed at a Student’s pace.
ILT: Instructor-Led Training. The student or supervisor must book a seat at a specific date (this is what the “force-enroll” feature takes care of)

## User Stories

### Education Supervisor

As a Supervisor I want to:

- Create a custom Program composed of Courses, so that my students can sign up for my Programs or I can enroll students into my Program at a later date.
- View my students' progress.
- Invite students to a program via link.

### Student

As Student I want to:

- view the Programs my Supervisor has recommended to me or enrolled me in, so that I can track my progress towards certifications.
- View the start/end dates of Programs and the courses they’re composed of and also keep track of which Courses are Self-Paced vs. ILT.

# Data Model

### Program

Id: string (GUID)
supervisorId: string (GUID)
Name: string
Description: string
Tags: string[]
courseSequence: string[] (GUID)
published: boolean
createdAt: string

### ProgramRegistration

Id: string (GUID)
StudentId: string (GUID)
ProgramId: string (GUID)
