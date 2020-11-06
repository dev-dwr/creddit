import { Field, ObjectType } from "type-graphql";
import { PrimaryGeneratedColumn, Column, CreateDateColumn, Entity, UpdateDateColumn,
   BaseEntity, ManyToOne } from "typeorm";
import { User } from "./User";

@ObjectType() //exposing this entity to graphql schema by @Field() and @ObjectType()
@Entity()
export class Post extends BaseEntity{

  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  title!: string;

  @Field()
  @Column()
  text!: string;

  @Field()
  @Column({type:'int', default: 0})
  points!: number;

  @Field()
  @Column()
  authorId: number
  
  //first parameter specifying type we want to be connected
  @Field()
  @ManyToOne(()=> User, user => user.posts)
  author:User

  @Field(() => String)
  @CreateDateColumn()
  createdAt = new Date();

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt = new Date();

}