# Hero UI Quick Start Guide 🚀

## Import Components

```tsx
import { 
  Button, 
  Card, 
  CardBody, 
  CardHeader,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Chip,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tabs,
  Tab,
  Select,
  SelectItem,
  Checkbox,
  Switch,
  Badge
} from "@heroui/react";
```

---

## Common Patterns

### 1. Button Variants
```tsx
<Button color="primary">Primary</Button>
<Button color="secondary">Secondary</Button>
<Button color="success">Success</Button>
<Button color="warning">Warning</Button>
<Button color="danger">Danger</Button>

<Button variant="solid">Solid</Button>
<Button variant="bordered">Bordered</Button>
<Button variant="light">Light</Button>
<Button variant="flat">Flat</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="shadow">Shadow</Button>
```

### 2. Card Component
```tsx
<Card className="max-w-md">
  <CardHeader className="flex gap-3">
    <Avatar src="/avatar.png" />
    <div className="flex flex-col">
      <p className="text-md">Restaurant Name</p>
      <p className="text-small text-default-500">Active</p>
    </div>
  </CardHeader>
  <CardBody>
    <p>Your content here</p>
  </CardBody>
</Card>
```

### 3. Form Input
```tsx
<Input
  type="email"
  label="Email"
  placeholder="Enter your email"
  description="We'll never share your email"
  errorMessage="Please enter a valid email"
  isInvalid={false}
/>
```

### 4. Modal Dialog
```tsx
const {isOpen, onOpen, onClose} = useDisclosure();

<Button onPress={onOpen}>Open Modal</Button>

<Modal isOpen={isOpen} onClose={onClose}>
  <ModalContent>
    <ModalHeader>Modal Title</ModalHeader>
    <ModalBody>
      <p>Modal content goes here</p>
    </ModalBody>
    <ModalFooter>
      <Button color="danger" variant="light" onPress={onClose}>
        Close
      </Button>
      <Button color="primary" onPress={onClose}>
        Action
      </Button>
    </ModalFooter>
  </ModalContent>
</Modal>
```

### 5. Table
```tsx
<Table aria-label="Example table">
  <TableHeader>
    <TableColumn>NAME</TableColumn>
    <TableColumn>STATUS</TableColumn>
    <TableColumn>ACTIONS</TableColumn>
  </TableHeader>
  <TableBody>
    <TableRow key="1">
      <TableCell>Restaurant 1</TableCell>
      <TableCell>
        <Chip color="success">Active</Chip>
      </TableCell>
      <TableCell>
        <Button size="sm">Edit</Button>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### 6. Dropdown Menu
```tsx
<Dropdown>
  <DropdownTrigger>
    <Button>Open Menu</Button>
  </DropdownTrigger>
  <DropdownMenu>
    <DropdownItem key="edit">Edit</DropdownItem>
    <DropdownItem key="delete" color="danger">
      Delete
    </DropdownItem>
  </DropdownMenu>
</Dropdown>
```

### 7. Tabs Navigation
```tsx
<Tabs aria-label="Options">
  <Tab key="overview" title="Overview">
    <p>Overview content</p>
  </Tab>
  <Tab key="settings" title="Settings">
    <p>Settings content</p>
  </Tab>
</Tabs>
```

### 8. Status Chips
```tsx
<Chip color="success">Active</Chip>
<Chip color="warning">Pending</Chip>
<Chip color="danger">Inactive</Chip>
<Chip color="primary">Trial</Chip>
```

---

## Color System

```tsx
// Available colors
"default" | "primary" | "secondary" | "success" | "warning" | "danger"
```

## Size System

```tsx
// Available sizes
"sm" | "md" | "lg" | "xl"
```

## Responsive Design

```tsx
// Use Tailwind classes
<Card className="w-full md:w-1/2 lg:w-1/3">
  Content
</Card>
```

---

## Animation Example

```tsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  <Card>
    Animated content
  </Card>
</motion.div>
```

---

## More Resources

- **Docs:** https://www.heroui.com/docs
- **Components:** https://www.heroui.com/docs/components
- **Examples:** https://www.heroui.com/examples
