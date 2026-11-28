---
title: Lec 15 ~ 18 Design Patterns and Best Practices
field: computer
context: self
topic: java
source: notion
originalUrl: https://www.notion.so/2ea3a7483f9780e88513eab5b7a7e3e0
date: 2024-11-28
tags:
  - Java
series: Java 언어
step: 15
---

---

---

## 1. Design Pattern

### ◽ Introduction to Design Patterns

- Definition
    - **Proven solutions** to recurring problems in software design
    - Provide **reusable templates** for building robust, scalable, and maintainable systems.
- Advantage
    - Effiiciency : Reduces time spent reinventing solutions
    - Scalability : Ensures code grows seamlessly with evolving requirements
    - Communication : Establishes a shared vocabulary for developers to discuss design solutions

### ◽ Key Principles of Design Patterns

1. Open/Closed Principle 
    - Code → Open for extension, closed for modification
    - Reducing bug risks in existing code
2. Single Responsibility Principle
    - Each class → one responsibility
    - Code readability & maintainability
3. DRY(Don’t Repeat Yourself)
    - Avoid duplicating logic
    
- Poor Design
    - Tight Coupling
    - Hard-coded Dependencies
    - Multi-Responsibility
    - No Abstraction

## 2. Creational Patterns

- Definition
    - Focus on managing object creation efficiently
- Advantage
    - Simplifies object instantiation
    - Ensure flexibility when creating objects dynamically

### 1) Singleton

- Definition
    - It ensures a class has only one instance throughout the application’s lifecycle and provides a global access point to that instance
- Key Characteristics
    - Single Instance : Only one instance of the class is created
    - Global Access : accessible globally through a static method `getInstace()`
    - Controlled Instantiation : ensure no other can create a new instance
- When to use
    - Shared Resource
    - Global State Management
- Advantage
    - Controlled Access
    - Reduces Memory Overhead
    - Consistency
- Disadventage
    - Global State Isuues
    - Thread Safety
    - Difficulty in Unit Testing
- Types
    1. Eager Initialization
        - Instance is created at the time of class loading
        - lightweight & always required
        
        Adv : Simple to implement, Thread-safe
        
        Disadv : Created even if not used
        
    2. Lazy Initialization
        - Instance is created only when needed
        
        Adv : Instance is created only when required
        
        Disadv : Not thread-safe.
        
    3. Thread-Safe Singleton
        - add `synchronized` keyword to ensure thread safety
        
        Adv : Thread-safe
        
        Disadv : In high-concurrency → overhead
        
- Cases
    - Cetralized logging system
    - Configuration manager
    - Logger manager

### 2) Factory Method

- Definition
    - It provides an interface for creating objects but allows subclasses to alter the type of objects that will be created
    - instead use `new` keyword, use method to create
- Key Characteristics
    - Encapsulation of Object Creation
    - Global Access
    - Controlled Instatiation
- When to Use
    - When exact type of object to be created is unknown
    - When adding new classes without modifying existing code is important
    - When a class delegates responsibility for instantiation
- Structure
    - Product : interface or abstract class
    - ConcreteProduct : class implement `Product`
    - Creator : interface of abstract class
    - ConcreteCreator : implement `Creator` create specific `ConcreteProduct`
- Advantage
    - Loose Coupling
    - Scalability
    - Encapsulation
- Disadvantage
    - Complexity
    - Overhead for Small Application
- Cases
    - Notification System

### 3) Builder

- Definition
    - It allows for the step-by-step construction of complex objects.
- Key Characteristics
    - Step-by_Step Construction
    - Separation of Representation and Construction
    - Immutability
    - Readable Code
- When to Use
    - Complex Object Creation
    - Code Clarity
    - Immutable Objects
- Structure
    - Product : being built
    - Builder : interface
    - Concrete Builder : Class, implement Builder
    - Director(optional)
- Advantage
    - Readability
    - Flexibility
    - Immutability
    - Scalability
- Disadvantage
    - Complexity
    - Overhead
- Cases
    - Creating House

## 3. Structural Patterns

- Definition
    - Design patterns that deal with the composition of classes and objects to form larger structures.
- Key Characteristic
    - Composition Over Inheritance
    - Enhance Relationships
    - Improve Modularity
    - Adaptability
- When to Use
    - Adapt the interface of one class to another
    - simplify and unify the system
    - make unrelated classes work together
    - add responsibilities dynamically to object without affecting other objects
- Advantage
    - Improved Modularity
    - Flexibility
    - Reusability
    - Separation of Concerns

### 1) Adapter

- Definition
    - It allows incompatible interfaces to work together
    - It acts as a bridge between two incompatible classes
        
        ex) power adapter
        
- Key Characteristics
    - Bridge Between Incompatible Interfaces
    - Single Responsibiltiy Principle
    - Flexibility
- When to Use
    - Integrate a class with interface not designed to work with
    - convert an interface into another that clients expect
- Structure
    - Target Interface : interface
    - Adaptee
    - Adapter : implement `Target Interface`
    - Client
- Advantage
    - Reusability
    - Flexibility
    - Decoupling
- Disadvantage
    - Increased Complexity
    - Limited Use Cases
- Cases
    - Media Player
    - Legacy Code Integration
    - Java IO Streams
    - Payment Systems

### 2) Decorator

- Definition
    - It allows behavior to be added to individual objects dynamically.
    - It provides an alternative to subclassing for extending functionality
- Key Characteristics
    - Dynamic Behavior Addition
    - Composition Over Inheritance
    - Transparent Interface
- When to Use
    - Add or modify the behaviot of object dynamically
    - There are many possible combinations of behavior
    - adhere Single Responsibility Princlple
- Structure
    - Component : interface
    - Concrete Component
    - Decorator : implements `Component`
    - Concrete Decorators : exten `Decorator`
- Advantage
    - Flexibility
    - Open/Closed Principle
    - Combining Behaviors
- Disadvantage
    - Increased Complexity
    - Overhead
    - Dependency on Composition
- Cases
    - Coffe Shop

### 3. Composite

- Definition
    - It allows you to compose objects into tree-like structures to represent part-whole hierarchies
    - It enables clients to treat individual objects and compositions of objects uniformly
- Key Characteristics
    - Tree Structure
    - Uniformity
    - Recursive Composition
    - Transparency
- When to Use
    - Represent part-whole hierarchies
    - Treat inidividual objects and compositions of object uniformly
    - Working with tree structure
- Structure
    - Component : interface
    - Leaf : implement `Component`
    - Composite : group of `Component` , implement `Component`
    - Client
- Advantage
    - Uniformity
    - Scalability
    - Flexibility
    - Transparency
- Disadvantage
    - Complexity
    - Overhead
    - Not Always Necessary
- Cases
    - File system
    - Organization Structure

## 4. Behavior Patterns

- Definition
    - Design Patterns that focus on the communication and interaction between objects
    - how objects collaborate and delegate responsibilites to achieve complex behaviors
    - Deal with runtime interactions rather than static structure
- Key Characteristics
    - Object Interaction
    - Flexibility
    - Reusability
    - Separation of Concerns
- Advantage
    - Encapsulation
    - Scalability
    - Loose Coupling
    - Code Reusability
- Disadvantage
    - Complexity
    - Learing Curve
    - Overhead

### 1) Strategy

- Definition
    - It defines a family of algorithms, encapsulates each one in separate class, and makes them interchangeable
    - It allows the algorithm to vary independently from the client
- Key Characteristics
    - Encapsulation of Algorithms
    - Interchangeability
    - Adherence to Open/Closed Principle
    - Delegation of Behavior
- When to Use
    - Multiple algorithms or behavior, chosen at runtime
    - avoid using large conditional statement
    - easily interchangeable and extendable algorithms
- Structure
    - Strategy Interface : define algorithms or behaviors
    - Concrete Strategies : Implement specific algorithms
    - Context
- Advantage
    - Eliminates Conditinal Logic
    - Flexibility
    - Extensibility
    - Reusability
- Disadvantage
    - Increased Complexity
    - Client Responsibility
    - Overhead
- Cases
    - Navigation system
    - Payment Processing System
    - Sorting Algorithm
    - Data Compression
    - Authentiaction Mechanism

### 2) Observer

- Definition
    - It defines a one-to-many-dependency between objects
    - One object changes → All dependents notified, updated
- Key Characteristics
    - Subject : being observed
    - Observers : observing
    - One-to-Many Relationship
- When to Use
    - Changes in one object need to propagate to other dependent object automatically
    - Object needs to broadcast state change
    - Want to decouple subject and observers to promote loose coupling
- Structure
    - Subject : maintain list of obserber, notify to them
    - Observer : interface, define update method
    - Concrete Subject : implement `subject`
    - Concrete Observer : implement `observer`
- Advantage
    - Loose Coupling
    - Scalability
    - Flexibility
    - Event-Driven Programming
- Disadvantage
    - Complexity
    - Performance Overhead
    - Memory Leaks
- Cases
    - Newsletter subscription
    - Weather Monitoring System

### 3) Template Method

- Definition
    - It defines the skeleton of an algorithm in a superclass but allows its subclasses to provide specific implementations for one or more steps
    - It promotes code reuse and ensures that the overall structure of the algorithm remains unchanged while allowing flexibility in specific steps
- Key Characteristics
    - Algorithm Skeleton
    - Abstract and Concrete Steps
    - Inversion of Control
    - Code Reuse
    - Hook Method(Optional)
- When to Use
    - Fixed Algorithm + some customized steps
    - Enforce a consistent workflow
    - promote code reus by placing common logic in a base class
- Structure
    - Abstract Class(Template Class) : define skeleton of algorithm
    - Template Mehtod
    - Abstract Method
    - Concrete Method
    - Concrete Subclasses
- Advantage
    - Code Reuse
    - Flexibility
    - Consistency
    - Ease of Maintence
- Disadvantage
    - Inheritance Dependency
    - Overriden Behavior Complexity
    - Limited Scalability
- Cases
    - Recipe template
    - Document Generation System
    - Web Frameworks
    - Game Development
    - Report Generation
